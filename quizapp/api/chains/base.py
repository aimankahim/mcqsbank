from langchain_openai import ChatOpenAI
from dotenv import load_dotenv

load_dotenv()

class BaseChain:
    llm = ChatOpenAI(model="gpt-4", temperature=0)

    @classmethod
    def get_llm(cls):
        return cls.llm 