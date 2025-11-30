"""
Performance Benchmark Script

Tests RAG chatbot performance with sample queries and reports latency metrics.
Validates that 95% of queries complete within 2.5 seconds.

Usage:
    python scripts/benchmark_performance.py [--queries N] [--url URL] [--report PATH]

Examples:
    python scripts/benchmark_performance.py
    python scripts/benchmark_performance.py --queries 100 --url http://localhost:8000
    python scripts/benchmark_performance.py --report performance_report.json
"""

import argparse
import asyncio
import json
import statistics
import time
from typing import List, Dict
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.config import settings
from src.services.embedding import EmbeddingService
from src.services.vectorstore import VectorStoreService
from src.services.llm import LLMService


# Sample test queries covering different topics
SAMPLE_QUERIES = [
    "What is inverse kinematics?",
    "Explain sensor fusion in robotics",
    "How do humanoid robots balance?",
    "What are the main components of a robotic arm?",
    "Describe forward kinematics",
    "What is a Jacobian matrix?",
    "How does machine learning apply to robotics?",
    "Explain trajectory planning",
    "What sensors are used in humanoid robots?",
    "How do robots perceive their environment?",
    "What is simultaneous localization and mapping (SLAM)?",
    "Explain the role of actuators in robotics",
    "What is computer vision in robotics?",
    "How do robots handle object manipulation?",
    "What is motion planning?",
    "Explain reinforcement learning for robots",
    "What is the difference between forward and inverse kinematics?",
    "How do robots use cameras for navigation?",
    "What is a degree of freedom in robotics?",
    "Explain path planning algorithms",
]


class PerformanceBenchmark:
    """Benchmark RAG chatbot performance"""

    def __init__(self):
        self.embedding_service = EmbeddingService()
        self.vectorstore_service = VectorStoreService()
        self.llm_service = LLMService()
        self.results = []

    async def run_single_query(self, question: str) -> Dict:
        """
        Run a single query and measure performance

        Returns:
            dict with latency metrics
        """
        start_time = time.time()
        metrics = {'question': question}

        try:
            # 1. Generate embedding
            embedding_start = time.time()
            query_vector = await self.embedding_service.embed_text(question)
            metrics['embedding_ms'] = (time.time() - embedding_start) * 1000

            # 2. Search vector store
            search_start = time.time()
            retrieved_docs = await self.vectorstore_service.search(
                query_vector=query_vector,
                limit=settings.top_k,
                score_threshold=settings.similarity_threshold
            )
            metrics['vector_search_ms'] = (time.time() - search_start) * 1000
            metrics['chunks_retrieved'] = len(retrieved_docs)

            # 3. Generate LLM response
            llm_start = time.time()
            context_chunks = [
                {'text': doc.text, 'metadata': doc.metadata}
                for doc in retrieved_docs
            ] if retrieved_docs else None

            result = await self.llm_service.generate_answer(
                question=question,
                context_chunks=context_chunks,
                chat_history=None
            )
            metrics['llm_generation_ms'] = (time.time() - llm_start) * 1000
            metrics['tokens_used'] = result.get('usage', {}).get('total_tokens', 0)

            # Total latency
            metrics['total_latency_ms'] = (time.time() - start_time) * 1000
            metrics['success'] = True

        except Exception as e:
            metrics['total_latency_ms'] = (time.time() - start_time) * 1000
            metrics['success'] = False
            metrics['error'] = str(e)

        return metrics

    async def run_benchmark(self, num_queries: int = 20) -> Dict:
        """
        Run benchmark with multiple queries

        Args:
            num_queries: Number of queries to run

        Returns:
            dict with aggregated statistics
        """
        print(f"\n{'=' * 70}")
        print(f"RAG Chatbot Performance Benchmark")
        print(f"{'=' * 70}\n")

        print(f"Running {num_queries} queries...")
        print(f"Top-K: {settings.top_k}, Similarity Threshold: {settings.similarity_threshold}\n")

        # Select queries (repeat if necessary)
        queries = (SAMPLE_QUERIES * ((num_queries // len(SAMPLE_QUERIES)) + 1))[:num_queries]

        # Run queries
        for i, question in enumerate(queries, 1):
            print(f"[{i}/{num_queries}] {question[:50]}...")
            result = await self.run_single_query(question)
            self.results.append(result)

            # Print quick status
            if result['success']:
                print(f"  ✓ {result['total_latency_ms']:.0f}ms "
                      f"(embed: {result['embedding_ms']:.0f}ms, "
                      f"search: {result['vector_search_ms']:.0f}ms, "
                      f"llm: {result['llm_generation_ms']:.0f}ms)")
            else:
                print(f"  ✗ Failed: {result.get('error', 'Unknown error')}")

        return self.compute_statistics()

    def compute_statistics(self) -> Dict:
        """Compute aggregate statistics from results"""
        successful_results = [r for r in self.results if r['success']]

        if not successful_results:
            return {
                'success': False,
                'message': 'No successful queries',
                'total_queries': len(self.results),
                'failed_queries': len(self.results)
            }

        latencies = [r['total_latency_ms'] for r in successful_results]
        embedding_latencies = [r['embedding_ms'] for r in successful_results]
        search_latencies = [r['vector_search_ms'] for r in successful_results]
        llm_latencies = [r['llm_generation_ms'] for r in successful_results]

        # Sort for percentile calculations
        latencies_sorted = sorted(latencies)

        stats = {
            'success': True,
            'total_queries': len(self.results),
            'successful_queries': len(successful_results),
            'failed_queries': len(self.results) - len(successful_results),
            'latency': {
                'min_ms': min(latencies),
                'max_ms': max(latencies),
                'mean_ms': statistics.mean(latencies),
                'median_ms': statistics.median(latencies),
                'stdev_ms': statistics.stdev(latencies) if len(latencies) > 1 else 0,
                'p50_ms': latencies_sorted[len(latencies_sorted) // 2],
                'p95_ms': latencies_sorted[int(len(latencies_sorted) * 0.95)],
                'p99_ms': latencies_sorted[int(len(latencies_sorted) * 0.99)],
            },
            'embedding': {
                'mean_ms': statistics.mean(embedding_latencies),
                'median_ms': statistics.median(embedding_latencies),
            },
            'vector_search': {
                'mean_ms': statistics.mean(search_latencies),
                'median_ms': statistics.median(search_latencies),
            },
            'llm_generation': {
                'mean_ms': statistics.mean(llm_latencies),
                'median_ms': statistics.median(llm_latencies),
            },
            'chunks_retrieved': {
                'mean': statistics.mean([r['chunks_retrieved'] for r in successful_results]),
            },
            'tokens': {
                'mean': statistics.mean([r['tokens_used'] for r in successful_results]),
            },
        }

        # Validate requirements
        stats['requirements'] = {
            'p95_under_2500ms': stats['latency']['p95_ms'] < 2500,
            'p95_value_ms': stats['latency']['p95_ms'],
        }

        return stats

    def print_report(self, stats: Dict):
        """Print formatted performance report"""
        print(f"\n{'=' * 70}")
        print(f"Performance Report")
        print(f"{'=' * 70}\n")

        print(f"Total Queries:      {stats['total_queries']}")
        print(f"Successful:         {stats['successful_queries']}")
        print(f"Failed:             {stats['failed_queries']}")
        print()

        if stats['success']:
            lat = stats['latency']
            print(f"Total Latency:")
            print(f"  Min:              {lat['min_ms']:.0f}ms")
            print(f"  Max:              {lat['max_ms']:.0f}ms")
            print(f"  Mean:             {lat['mean_ms']:.0f}ms")
            print(f"  Median (P50):     {lat['median_ms']:.0f}ms")
            print(f"  P95:              {lat['p95_ms']:.0f}ms")
            print(f"  P99:              {lat['p99_ms']:.0f}ms")
            print(f"  StdDev:           {lat['stdev_ms']:.0f}ms")
            print()

            print(f"Breakdown (Mean):")
            print(f"  Embedding:        {stats['embedding']['mean_ms']:.0f}ms")
            print(f"  Vector Search:    {stats['vector_search']['mean_ms']:.0f}ms")
            print(f"  LLM Generation:   {stats['llm_generation']['mean_ms']:.0f}ms")
            print()

            print(f"Other Metrics:")
            print(f"  Chunks Retrieved: {stats['chunks_retrieved']['mean']:.1f} avg")
            print(f"  Tokens Used:      {stats['tokens']['mean']:.0f} avg")
            print()

            print(f"Requirements:")
            req = stats['requirements']
            status = "✓ PASS" if req['p95_under_2500ms'] else "✗ FAIL"
            print(f"  P95 < 2500ms:     {status} ({req['p95_value_ms']:.0f}ms)")
        else:
            print(f"ERROR: {stats.get('message', 'Unknown error')}")

        print(f"\n{'=' * 70}\n")


async def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Benchmark RAG chatbot performance'
    )
    parser.add_argument(
        '--queries',
        type=int,
        default=20,
        help='Number of queries to run (default: 20)'
    )
    parser.add_argument(
        '--report',
        type=str,
        default=None,
        help='Path to save JSON report (optional)'
    )

    args = parser.parse_args()

    # Run benchmark
    benchmark = PerformanceBenchmark()
    stats = await benchmark.run_benchmark(num_queries=args.queries)

    # Print report
    benchmark.print_report(stats)

    # Save report if requested
    if args.report:
        with open(args.report, 'w') as f:
            json.dump(stats, f, indent=2)
        print(f"Report saved to: {args.report}\n")

    # Exit with appropriate code
    if stats['success'] and stats['requirements']['p95_under_2500ms']:
        return 0
    else:
        return 1


if __name__ == '__main__':
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
