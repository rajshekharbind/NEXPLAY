import json
import os
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.mcp.schemas import MCPToolDefinition, MCPToolResult, JSONRPCRequest, JSONRPCResponse
from app.mcp.tools import get_all_tool_definitions, execute_mcp_tool
from app.mcp.server import handle_jsonrpc_request
from app.schemas.common import ResponseEnvelope
from app.core.logging import logger

router = APIRouter()

@router.get(
    "/tools",
    response_model=ResponseEnvelope[List[MCPToolDefinition]],
    summary="List all registered Native Entertainment MCP Tools"
)
async def list_tools():
    """Retrieve full catalog of registered Model Context Protocol tools and their input schemas."""
    tools = get_all_tool_definitions()
    return ResponseEnvelope(
        success=True,
        message=f"Retrieved {len(tools)} registered MCP tools",
        data=tools
    )

@router.post(
    "/execute",
    response_model=ResponseEnvelope[MCPToolResult],
    summary="Execute an MCP tool directly via HTTP"
)
async def execute_tool(
    payload: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Direct HTTP execution of an MCP tool.
    Accepts tool name and arguments dictionary.
    """
    tool_name = payload.get("name")
    arguments = payload.get("arguments") or {}

    if not tool_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Field 'name' is required"
        )

    result = await execute_mcp_tool(tool_name, arguments, db=db)
    return ResponseEnvelope(
        success=not result.isError,
        message=f"Executed tool '{tool_name}'",
        data=result
    )

@router.post(
    "/rpc",
    response_model=JSONRPCResponse,
    summary="Standard JSON-RPC 2.0 MCP Protocol Gateway"
)
async def jsonrpc_gateway(request: JSONRPCRequest):
    """
    Standard JSON-RPC 2.0 endpoint for MCP clients connecting over HTTP.
    Supports 'initialize', 'tools/list', 'tools/call', and 'ping'.
    """
    req_dict = request.model_dump(exclude_none=True)
    resp_dict = await handle_jsonrpc_request(req_dict)
    return JSONRPCResponse(**resp_dict)

@router.get(
    "/config",
    summary="Get configuration snippet for Claude Desktop and Cursor"
)
async def get_mcp_configuration():
    """Returns sample configuration JSON to add NEXPLAY MCP server to Cursor or Claude Desktop."""
    backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    run_script = os.path.join(backend_path, "run_mcp.py")

    claude_desktop_config = {
        "mcpServers": {
            "nexplay": {
                "command": "python",
                "args": [run_script],
                "env": {
                    "PYTHONPATH": backend_path
                }
            }
        }
    }

    cursor_config = {
        "name": "nexplay",
        "type": "stdio",
        "command": f"python {run_script}"
    }

    return ResponseEnvelope(
        success=True,
        message="Generated MCP client configuration snippets",
        data={
            "claude_desktop": claude_desktop_config,
            "cursor": cursor_config,
            "http_endpoint": "/api/v1/mcp/rpc",
            "tools_count": len(get_all_tool_definitions())
        }
    )
