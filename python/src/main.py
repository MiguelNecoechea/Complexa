# Fast API
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool
from pydantic import BaseModel

# Services
from .services.nlp_service import NLPService
from typing import List
class TextRequest(BaseModel):
    text: str


class NLPApplication:
    def __init__(self):
        self.app = FastAPI(title="NLPApi", version="1.0.0")
        self.local_nlp_service = NLPService()
        self._setup_middleware()
        self._register_routes()

    def _setup_middleware(self):
        # CORS Middleware
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    def _register_routes(self):
        @self.app.post("/tokenize", response_class=JSONResponse)
        async def tokenize(request: TextRequest):
            data = self.local_nlp_service.tokenize(request.text)
            return JSONResponse(content=data, status_code=200)

        @self.app.post("/tokenize_batch")
        async def tokenize_batch(request: List[TextRequest]):
            texts = [r.text for r in request]
            token_lists = await run_in_threadpool(
                self.local_nlp_service.tokenize_batch, texts
            )
            return JSONResponse(content=token_lists)

def create_app():
    return NLPApplication().app

app = create_app()
