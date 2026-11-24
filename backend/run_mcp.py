#!/usr/bin/env python
"""
NEXPLAY MCP Server Launcher
Runs the native Model Context Protocol server over stdio for AI clients (Cursor, Claude Desktop, Antigravity).
"""
import sys
import os
import asyncio

# Ensure backend root is on sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.mcp.server import run_stdio_server

if __name__ == "__main__":
    try:
        asyncio.run(run_stdio_server())
    except KeyboardInterrupt:
        sys.exit(0)
