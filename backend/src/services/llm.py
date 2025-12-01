"""
LLM service using OpenAI GPT-4-turbo-preview.
Handles RAG query processing and answer generation.
"""
from typing import List, Dict, Any, AsyncGenerator, Optional
from openai import AsyncOpenAI

from src.config import settings
from src.utils.logger import logger


class LLMService:
    """Service for LLM-based answer generation."""

    def __init__(self):
        """Initialize LLM service with OpenAI client."""
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = settings.llm_model

    def _build_rag_prompt(
        self,
        question: str,
        context_chunks: List[Dict[str, Any]],
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> List[Dict[str, str]]:
        """
        Build prompt messages for RAG query.

        Args:
            question: User's question
            context_chunks: Retrieved document chunks (can be empty list)
            chat_history: Optional chat history for context

        Returns:
            List of message dictionaries for OpenAI API
        """
        # Check if we have context
        if not context_chunks:
            # No relevant context found - general chat mode
            system_message = {
                "role": "system",
                "content": (
                    "You are an expert AI assistant for the 'Physical AI & Humanoid Robotics' textbook. "
                    "No relevant context was found in the textbook for this question. "
                    "You can provide a general answer based on your knowledge, but mention that this specific information "
                    "wasn't found in the textbook and may not be covered in the book."
                )
            }
            messages = [system_message]
        else:
            # Build context from retrieved chunks
            context_text = "\n\n".join([
                f"[Source {i+1}] {chunk['text']}"
                for i, chunk in enumerate(context_chunks)
            ])

            # System message
            system_message = {
                "role": "system",
                "content": (
                    "You are an expert AI assistant for the 'Physical AI & Humanoid Robotics' textbook. "
                    "Your task is to answer questions based ONLY on the provided context from the book. "
                    "If the answer cannot be found in the context, say 'I cannot find this information in the provided context.' "
                    "Be concise, accurate, and cite source numbers when possible (e.g., 'According to Source 1...')."
                )
            }

            # Context message
            context_message = {
                "role": "user",
                "content": f"Context from textbook:\n\n{context_text}"
            }

            messages = [system_message, context_message]

        # Add chat history if provided
        if chat_history:
            messages.extend(chat_history[-5:])  # Last 5 messages for context

        # Add current question
        messages.append({
            "role": "user",
            "content": f"Question: {question}"
        })

        return messages

    def _build_selection_prompt(
        self,
        question: str,
        selected_text: str,
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> List[Dict[str, str]]:
        """
        Build prompt messages for selection-based query.

        Args:
            question: User's question
            selected_text: Text selected by user
            chat_history: Optional chat history

        Returns:
            List of message dictionaries for OpenAI API
        """
        system_message = {
            "role": "system",
            "content": (
                "You are an expert AI assistant for the 'Physical AI & Humanoid Robotics' textbook. "
                "Answer the question based ONLY on the selected text provided. "
                "Be concise and accurate. If the selected text doesn't contain enough information to answer, say so."
            )
        }

        context_message = {
            "role": "user",
            "content": f"Selected text:\n\n{selected_text}"
        }

        messages = [system_message, context_message]

        # Add chat history if provided
        if chat_history:
            messages.extend(chat_history[-5:])

        # Add current question
        messages.append({
            "role": "user",
            "content": f"Question: {question}"
        })

        return messages

    async def generate_answer(
        self,
        question: str,
        context_chunks: List[Dict[str, Any]] = None,
        selected_text: str = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
        temperature: float = 0.3,
        max_tokens: int = 800
    ) -> Dict[str, Any]:
        """
        Generate answer for a question (non-streaming).

        Args:
            question: User's question
            context_chunks: Retrieved chunks for RAG query (mutually exclusive with selected_text)
            selected_text: Selected text for selection query (mutually exclusive with context_chunks)
            chat_history: Optional chat history
            temperature: LLM temperature (0.0-1.0)
            max_tokens: Maximum tokens in response

        Returns:
            Dictionary with 'answer' and 'usage' (tokens)

        Raises:
            ValueError: If neither or both context_chunks and selected_text provided
            Exception: If LLM generation fails
        """
        try:
            # Build prompt based on query type
            if context_chunks is not None and selected_text:
                raise ValueError("Provide either context_chunks or selected_text, not both")
            elif context_chunks is not None:  # Explicitly check for None (empty list is valid)
                messages = self._build_rag_prompt(question, context_chunks, chat_history)
            elif selected_text:
                messages = self._build_selection_prompt(question, selected_text, chat_history)
            else:
                raise ValueError("Must provide either context_chunks or selected_text")

            # Generate response
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )

            answer = response.choices[0].message.content
            usage = {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            }

            logger.info(f"Generated answer ({usage['total_tokens']} tokens)")
            return {
                "answer": answer,
                "usage": usage
            }

        except Exception as e:
            logger.error(f"Failed to generate answer: {e}")
            raise

    async def generate_answer_stream(
        self,
        question: str,
        context_chunks: List[Dict[str, Any]] = None,
        selected_text: str = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
        temperature: float = 0.3,
        max_tokens: int = 800
    ) -> AsyncGenerator[str, None]:
        """
        Generate streaming answer for a question.

        Args:
            question: User's question
            context_chunks: Retrieved chunks for RAG query
            selected_text: Selected text for selection query
            chat_history: Optional chat history
            temperature: LLM temperature
            max_tokens: Maximum tokens in response

        Yields:
            Answer tokens as they are generated

        Raises:
            ValueError: If neither or both context_chunks and selected_text provided
            Exception: If LLM generation fails
        """
        try:
            # Build prompt based on query type
            if context_chunks is not None and selected_text:
                raise ValueError("Provide either context_chunks or selected_text, not both")
            elif context_chunks is not None:  # Explicitly check for None (empty list is valid)
                messages = self._build_rag_prompt(question, context_chunks, chat_history)
            elif selected_text:
                messages = self._build_selection_prompt(question, selected_text, chat_history)
            else:
                raise ValueError("Must provide either context_chunks or selected_text")

            # Generate streaming response
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True
            )

            async for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content

            logger.info("Completed streaming answer generation")

        except Exception as e:
            logger.error(f"Failed to generate streaming answer: {e}")
            raise
