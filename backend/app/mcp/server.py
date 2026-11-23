import sys
import json
import asyncio
from typing import Dict, Any, Optional

from app.mcp.schemas import JSONRPCRequest, JSONRPCResponse
from app.mcp.tools import get_all_tool_definitions, execute_mcp_tool
from app.core.logging import logger

PROTOCOL_VERSION = "2024-11-05"
SERVER_INFO = {
    "name": "nexplay-mcp-server",
    "version": "1.0.0",
    "description": "NEXPLAY Native Entertainment Model Context Protocol Server"
}

async def handle_jsonrpc_request(req_data: Dict[str, Any]) -> Dict[str, Any]:
    """Process a single JSON-RPC 2.0 MCP request."""
    req_id = req_data.get("id")
    method = req_data.get("method")
    params = req_data.get("params") or {}

    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "protocolVersion": PROTOCOL_VERSION,
                "serverInfo": SERVER_INFO,
                "capabilities": {
                    "tools": {"listChanged": False},
                    "resources": {"subscribe": False, "listChanged": False}
                }
            }
        }

    elif method == "notifications/initialized":
        # Notification from client that initialization finished
        return {}

    elif method == "ping":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {}
        }

    elif method == "tools/list":
        tools = get_all_tool_definitions()
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "tools": [t.model_dump() for t in tools]
            }
        }

    elif method == "tools/call":
        tool_name = params.get("name")
        arguments = params.get("arguments") or {}

        if not tool_name:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {
                    "code": -32602,
                    "message": "Invalid params: 'name' is required for tools/call"
                }
            }

        result = await execute_mcp_tool(tool_name, arguments)
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": result.model_dump()
        }

    else:
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {
                "code": -32601,
                "message": f"Method '{method}' not found"
            }
        }

async def run_stdio_server():
    """Run MCP server over standard input/output (stdio transport)."""
    loop = asyncio.get_running_loop()
    reader = asyncio.StreamReader()
    protocol = asyncio.StreamReaderProtocol(reader)
    await loop.connect_read_pipe(lambda: protocol, sys.stdin)

    while True:
        line = await reader.readline()
        if not line:
            break
        text = line.decode().strip()
        if not text:
            continue
        try:
            req_data = json.loads(text)
            resp = await handle_jsonrpc_request(req_data)
            if resp: # Notifications return empty dict and shouldn't be answered
                sys.stdout.write(json.dumps(resp) + "\n")
                sys.stdout.flush()
        except Exception as e:
            err_resp = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {"code": -32700, "message": f"Parse error: {str(e)}"}
            }
            sys.stdout.write(json.dumps(err_resp) + "\n")
            sys.stdout.flush()

if __name__ == "__main__":
    asyncio.run(run_stdio_server())
