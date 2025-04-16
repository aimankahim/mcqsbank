from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from ..serializers import LearningSerializer

class LearningAPIView(APIView):
    def post(self, request):
        try:
            serializer = LearningSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Process the learning request
            result = serializer.save()
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 