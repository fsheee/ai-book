"""
Clear Qdrant Collection Script

Utility script to clear all vectors from the Qdrant collection.
Useful before re-ingesting content or resetting the vector database.

Usage:
    python scripts/clear_collection.py [--confirm]

WARNING: This is a destructive operation. All embedded content will be deleted.
"""

import argparse
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.config import settings
from src.services.vectorstore import VectorStoreService
from src.utils.logger import logger


async def clear_collection(confirm: bool = False):
    """
    Clear all vectors from Qdrant collection

    Args:
        confirm: Must be True to proceed with deletion

    Returns:
        dict with deletion results
    """
    if not confirm:
        print("\nERROR: You must confirm deletion with --confirm flag")
        print("This operation will delete ALL vectors from the collection.")
        print("\nUsage: python scripts/clear_collection.py --confirm\n")
        return {'success': False, 'message': 'Not confirmed'}

    print(f"\n{'=' * 70}")
    print(f"WARNING: DESTRUCTIVE OPERATION")
    print(f"{'=' * 70}\n")
    print(f"You are about to delete ALL vectors from collection: {settings.qdrant_collection_name}")
    print("\nThis action cannot be undone!\n")

    # Double confirmation
    response = input("Type 'DELETE' to confirm: ")
    if response != 'DELETE':
        print("\nCancelled. No data was deleted.\n")
        return {'success': False, 'message': 'Not confirmed'}

    vectorstore = VectorStoreService()

    try:
        # Get collection info before deletion
        logger.info("Fetching collection info...")
        info = await vectorstore.get_collection_info()
        vectors_count = info.get('vectors_count', 0)

        print(f"\nCollection info:")
        print(f"  Name:           {info.get('collection_name', 'unknown')}")
        print(f"  Vectors:        {vectors_count}")
        print(f"  Status:         {info.get('status', 'unknown')}")

        if vectors_count == 0:
            print("\nCollection is already empty. Nothing to delete.\n")
            return {'success': True, 'vectors_deleted': 0, 'message': 'Already empty'}

        # Perform deletion
        print(f"\nDeleting {vectors_count} vectors...")
        logger.warning(f"Clearing collection: {settings.qdrant_collection_name}")

        result = await vectorstore.clear_collection()

        print(f"\n✓ Successfully deleted {result['vectors_deleted']} vectors")
        logger.info(f"Collection cleared: {result['vectors_deleted']} vectors deleted")

        return {
            'success': True,
            'vectors_deleted': result['vectors_deleted'],
            'message': 'Collection cleared successfully'
        }

    except Exception as e:
        logger.error(f"Failed to clear collection: {e}")
        print(f"\n✗ ERROR: {e}\n")
        return {'success': False, 'error': str(e)}


async def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Clear all vectors from Qdrant collection',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
WARNING: This is a destructive operation!

This script will delete ALL vectors from the Qdrant collection.
Use this when you need to:
  - Re-ingest all content from scratch
  - Reset the vector database
  - Clear test data

After clearing, you'll need to run the ingestion script to re-populate the collection:
  python scripts/ingest_docs.py

Examples:
  python scripts/clear_collection.py --confirm
        """
    )
    parser.add_argument(
        '--confirm',
        action='store_true',
        help='Confirm deletion (required)'
    )

    args = parser.parse_args()

    # Run clear operation
    result = await clear_collection(confirm=args.confirm)

    print(f"\n{'=' * 70}")
    print(f"Operation Summary")
    print(f"{'=' * 70}")
    print(f"Status:   {'SUCCESS' if result['success'] else 'FAILED'}")
    print(f"Message:  {result.get('message', 'N/A')}")
    if result.get('vectors_deleted'):
        print(f"Deleted:  {result['vectors_deleted']} vectors")
    if result.get('error'):
        print(f"Error:    {result['error']}")
    print(f"{'=' * 70}\n")

    return 0 if result['success'] else 1


if __name__ == '__main__':
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
