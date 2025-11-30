"""
Cleanup Old Chat History Script

Deletes chat messages and usage logs older than the retention period (default: 30 days).
This script should be run periodically via cron job or scheduled task.

Usage:
    python scripts/cleanup_old_chats.py [--days N] [--dry-run]

Examples:
    python scripts/cleanup_old_chats.py                  # Delete chats older than 30 days
    python scripts/cleanup_old_chats.py --days 60        # Delete chats older than 60 days
    python scripts/cleanup_old_chats.py --dry-run        # Preview what would be deleted

Configuration:
    Set CHAT_RETENTION_DAYS in .env to change default retention period
"""

import argparse
import asyncio
from datetime import datetime, timedelta
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.config import settings
from src.services.database import DatabaseService
from src.utils.logger import logger


async def cleanup_old_chats(retention_days: int = 30, dry_run: bool = False):
    """
    Delete chat messages and usage logs older than retention period

    Args:
        retention_days: Number of days to retain chats (default: 30)
        dry_run: If True, only count records without deleting

    Returns:
        dict with deletion statistics
    """
    cutoff_date = datetime.utcnow() - timedelta(days=retention_days)

    logger.info(f"Starting cleanup of chats older than {retention_days} days")
    logger.info(f"Cutoff date: {cutoff_date.isoformat()}")

    if dry_run:
        logger.info("DRY RUN MODE - No data will be deleted")

    database = DatabaseService()

    try:
        # Initialize database connection
        await database.initialize()

        # Count records to be deleted
        count_query = """
            SELECT
                (SELECT COUNT(*) FROM chats WHERE created_at < $1) as chat_count,
                (SELECT COUNT(*) FROM messages WHERE created_at < $1) as message_count,
                (SELECT COUNT(*) FROM usage_logs WHERE created_at < $1) as usage_count
        """

        result = await database.execute_query(count_query, cutoff_date, fetch_one=True)

        chat_count = result['chat_count'] if result else 0
        message_count = result['message_count'] if result else 0
        usage_count = result['usage_count'] if result else 0

        logger.info(f"Records to be deleted:")
        logger.info(f"  Chats:        {chat_count}")
        logger.info(f"  Messages:     {message_count}")
        logger.info(f"  Usage logs:   {usage_count}")

        if dry_run:
            logger.info("DRY RUN - Exiting without deletion")
            return {
                'dry_run': True,
                'retention_days': retention_days,
                'cutoff_date': cutoff_date.isoformat(),
                'would_delete': {
                    'chats': chat_count,
                    'messages': message_count,
                    'usage_logs': usage_count,
                }
            }

        # Perform deletion (with cascading for related records)
        logger.info("Starting deletion...")

        # Delete messages (will cascade from chats if foreign key set up)
        delete_messages_query = "DELETE FROM messages WHERE created_at < $1"
        await database.execute_query(delete_messages_query, cutoff_date)
        logger.info(f"Deleted {message_count} messages")

        # Delete usage logs
        delete_usage_query = "DELETE FROM usage_logs WHERE created_at < $1"
        await database.execute_query(delete_usage_query, cutoff_date)
        logger.info(f"Deleted {usage_count} usage logs")

        # Delete chats
        delete_chats_query = "DELETE FROM chats WHERE created_at < $1"
        await database.execute_query(delete_chats_query, cutoff_date)
        logger.info(f"Deleted {chat_count} chats")

        logger.info("Cleanup completed successfully")

        return {
            'success': True,
            'dry_run': False,
            'retention_days': retention_days,
            'cutoff_date': cutoff_date.isoformat(),
            'deleted': {
                'chats': chat_count,
                'messages': message_count,
                'usage_logs': usage_count,
            }
        }

    except Exception as e:
        logger.error(f"Cleanup failed: {e}")
        return {
            'success': False,
            'error': str(e),
            'retention_days': retention_days,
        }

    finally:
        # Close database connection
        await database.close()


async def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Cleanup old chat history and usage logs',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/cleanup_old_chats.py
  python scripts/cleanup_old_chats.py --days 60
  python scripts/cleanup_old_chats.py --dry-run

This script should be run periodically (e.g., daily via cron) to maintain
the database size and comply with data retention policies.

Suggested cron schedule (daily at 2 AM):
  0 2 * * * cd /path/to/backend && python scripts/cleanup_old_chats.py
        """
    )
    parser.add_argument(
        '--days',
        type=int,
        default=getattr(settings, 'CHAT_RETENTION_DAYS', 30),
        help='Number of days to retain chats (default: 30)'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Preview deletion without actually deleting data'
    )

    args = parser.parse_args()

    print(f"\n{'=' * 70}")
    print(f"Chat History Cleanup")
    print(f"{'=' * 70}\n")

    # Run cleanup
    result = await cleanup_old_chats(
        retention_days=args.days,
        dry_run=args.dry_run
    )

    # Print results
    print(f"\nCleanup Summary:")
    print(f"{'=' * 70}")
    print(f"Retention Period:   {result['retention_days']} days")
    print(f"Cutoff Date:        {result.get('cutoff_date', 'N/A')}")
    print()

    if result.get('dry_run'):
        print(f"DRY RUN - Would delete:")
        would_delete = result.get('would_delete', {})
        print(f"  Chats:            {would_delete.get('chats', 0)}")
        print(f"  Messages:         {would_delete.get('messages', 0)}")
        print(f"  Usage Logs:       {would_delete.get('usage_logs', 0)}")
        print(f"\nNo data was deleted. Run without --dry-run to perform deletion.")
    elif result.get('success'):
        print(f"Successfully deleted:")
        deleted = result.get('deleted', {})
        print(f"  Chats:            {deleted.get('chats', 0)}")
        print(f"  Messages:         {deleted.get('messages', 0)}")
        print(f"  Usage Logs:       {deleted.get('usage_logs', 0)}")
    else:
        print(f"ERROR: {result.get('error', 'Unknown error')}")
        print(f"{'=' * 70}\n")
        return 1

    print(f"{'=' * 70}\n")
    return 0


if __name__ == '__main__':
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
