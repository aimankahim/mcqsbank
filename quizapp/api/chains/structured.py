# To run this code you need to install the following dependencies:
# pip install pymongo openai python-dotenv biopython sentence-transformers networkx

import os
import logging
import json
from typing import List, Dict, Optional, Any
from datetime import datetime
from dotenv import load_dotenv
from pymongo import MongoClient
from Bio import Entrez
import openai
from sentence_transformers import SentenceTransformer
import networkx as nx

# Set up logging
logger = logging.getLogger(__name__)

class ResearchPaperSystem:
    def __init__(self):
        """Initialize the Research Paper Analysis System."""
        load_dotenv()
        
        # Configure API keys and connections
        self.pubmed_email = os.getenv('PUBMED_EMAIL')
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        self.mongodb_uri = os.getenv('MONGODB_URI')
        
        # Initialize components
        self._setup_mongodb()
        self._setup_entrez()
        self._setup_openai()
        self._setup_embedding_model()
        self._setup_graph()
        
        logger.info("Research Paper System initialized successfully")

    def _setup_mongodb(self):
        """Set up MongoDB connection."""
        try:
            self.mongo_client = MongoClient(self.mongodb_uri)
            self.db = self.mongo_client.research_papers
            self.papers_collection = self.db.papers
            self.queries_collection = self.db.queries
            logger.info("MongoDB connection established")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            raise

    def _setup_entrez(self):
        """Configure Entrez for PubMed access."""
        Entrez.email = self.pubmed_email
        logger.info("Entrez configured")

    def _setup_openai(self):
        """Configure OpenAI API."""
        openai.api_key = self.openai_api_key
        logger.info("OpenAI configured")

    def _setup_embedding_model(self):
        """Initialize the sentence transformer model for embeddings."""
        try:
            self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("Embedding model initialized")
        except Exception as e:
            logger.error(f"Failed to initialize embedding model: {str(e)}")
            raise

    def _setup_graph(self):
        """Initialize the graph database for paper relationships."""
        self.graph = nx.Graph()
        logger.info("Graph database initialized")

    def search(self, query: str, max_results: int = 10) -> List[Dict]:
        """Perform a keyword-based search on PubMed."""
        try:
            logger.info(f"Searching PubMed for: {query}")
            
            # Search PubMed
            handle = Entrez.esearch(db="pubmed", term=query, retmax=max_results)
            record = Entrez.read(handle)
            handle.close()
            
            # Fetch paper details
            paper_ids = record["IdList"]
            papers = []
            
            for paper_id in paper_ids:
                paper = self._fetch_paper_details(paper_id)
                if paper:
                    papers.append(paper)
            
            logger.info(f"Found {len(papers)} papers")
            return papers
            
        except Exception as e:
            logger.error(f"Search failed: {str(e)}")
            raise

    def _fetch_paper_details(self, paper_id: str) -> Optional[Dict]:
        """Fetch detailed information for a specific paper."""
        try:
            handle = Entrez.efetch(db="pubmed", id=paper_id, rettype="medline", retmode="text")
            record = Entrez.read(handle)
            handle.close()
            
            if not record['PubmedArticle']:
                return None
                
            article = record['PubmedArticle'][0]
            
            # Extract paper details
            paper = {
                "id": paper_id,
                "title": article['MedlineCitation']['Article']['ArticleTitle'],
                "authors": [f"{author['LastName']} {author['ForeName']}" 
                          for author in article['MedlineCitation']['Article']['AuthorList']],
                "abstract": article['MedlineCitation']['Article'].get('Abstract', {}).get('AbstractText', [''])[0],
                "metadata": {
                    "publication_date": article['MedlineCitation']['Article']['Journal']['JournalIssue']['PubDate'],
                    "journal": article['MedlineCitation']['Article']['Journal']['Title'],
                    "doi": self._extract_doi(article)
                }
            }
            
            # Generate embeddings
            paper['vector_embedding'] = self._generate_embedding(paper['abstract'])
            
            # Store in MongoDB
            self.papers_collection.update_one(
                {"id": paper_id},
                {"$set": paper},
                upsert=True
            )
            
            return paper
            
        except Exception as e:
            logger.error(f"Failed to fetch paper details: {str(e)}")
            return None

    def _extract_doi(self, article: Dict) -> Optional[str]:
        """Extract DOI from article metadata."""
        try:
            for identifier in article['MedlineCitation']['Article']['ELocationID']:
                if identifier.attributes['EIdType'] == 'doi':
                    return identifier
        except:
            return None

    def _generate_embedding(self, text: str) -> List[float]:
        """Generate vector embedding for text."""
        try:
            return self.embedding_model.encode(text).tolist()
        except Exception as e:
            logger.error(f"Failed to generate embedding: {str(e)}")
            return []

    def semantic_search(self, query: str, top_k: int = 5) -> List[Dict]:
        """Perform semantic search across stored papers."""
        try:
            # Generate query embedding
            query_embedding = self._generate_embedding(query)
            
            # Find similar papers using vector similarity
            pipeline = [
                {
                    "$addFields": {
                        "similarity": {
                            "$function": {
                                "body": "function(embedding1, embedding2) { return 1 - cosineDistance(embedding1, embedding2); }",
                                "args": ["$vector_embedding", query_embedding],
                                "lang": "js"
                            }
                        }
                    }
                },
                {"$sort": {"similarity": -1}},
                {"$limit": top_k}
            ]
            
            results = list(self.papers_collection.aggregate(pipeline))
            logger.info(f"Found {len(results)} semantically similar papers")
            return results
            
        except Exception as e:
            logger.error(f"Semantic search failed: {str(e)}")
            raise

    def build_graph(self):
        """Build graph of paper relationships."""
        try:
            # Clear existing graph
            self.graph.clear()
            
            # Get all papers
            papers = list(self.papers_collection.find())
            
            # Add nodes
            for paper in papers:
                self.graph.add_node(paper['id'], **paper)
            
            # Add edges based on semantic similarity
            for i, paper1 in enumerate(papers):
                for paper2 in papers[i+1:]:
                    similarity = self._calculate_similarity(
                        paper1['vector_embedding'],
                        paper2['vector_embedding']
                    )
                    if similarity > 0.8:  # Threshold for connection
                        self.graph.add_edge(paper1['id'], paper2['id'], weight=similarity)
            
            logger.info(f"Graph built with {self.graph.number_of_nodes()} nodes and {self.graph.number_of_edges()} edges")
            
        except Exception as e:
            logger.error(f"Failed to build graph: {str(e)}")
            raise

    def _calculate_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors."""
        try:
            from numpy import dot
            from numpy.linalg import norm
            return dot(vec1, vec2) / (norm(vec1) * norm(vec2))
        except Exception as e:
            logger.error(f"Failed to calculate similarity: {str(e)}")
            return 0.0

    def query(self, question: str) -> Dict:
        """Process natural language question and return answer."""
        try:
            # Find relevant papers
            relevant_papers = self.semantic_search(question)
            
            # Construct context
            context = self._construct_context(relevant_papers)
            
            # Generate answer using OpenAI
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a research paper analysis assistant."},
                    {"role": "user", "content": f"Context: {context}\n\nQuestion: {question}"}
                ]
            )
            
            answer = response.choices[0].message.content
            
            # Store query and response
            query_record = {
                "text": question,
                "context": {
                    "papers": [p['id'] for p in relevant_papers],
                    "sections": ["abstract"]  # Could be expanded
                },
                "response": answer,
                "timestamp": datetime.utcnow()
            }
            self.queries_collection.insert_one(query_record)
            
            return {
                "answer": answer,
                "sources": [p['id'] for p in relevant_papers]
            }
            
        except Exception as e:
            logger.error(f"Query processing failed: {str(e)}")
            raise

    def _construct_context(self, papers: List[Dict]) -> str:
        """Construct context from relevant papers."""
        context_parts = []
        for paper in papers:
            context_parts.append(f"Title: {paper['title']}\nAbstract: {paper['abstract']}\n")
        return "\n".join(context_parts)

    def get_related_papers(self, paper_id: str, max_depth: int = 2) -> List[Dict]:
        """Get papers related to a specific paper through graph traversal."""
        try:
            if paper_id not in self.graph:
                return []
            
            # Find connected papers within max_depth
            connected_papers = []
            for node in nx.single_source_shortest_path_length(self.graph, paper_id, max_depth).keys():
                if node != paper_id:
                    paper_data = self.graph.nodes[node]
                    connected_papers.append(paper_data)
            
            return connected_papers
            
        except Exception as e:
            logger.error(f"Failed to get related papers: {str(e)}")
            return []

if __name__ == "__main__":
    # Example usage
    system = ResearchPaperSystem()
    
    # Search for papers
    results = system.search("machine learning applications in healthcare")
    
    # Build graph
    system.build_graph()
    
    # Query the system
    answer = system.query("What are the latest developments in cancer immunotherapy?")
    print(answer) 