from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, ConfigDict, Field

class MCPToolDefinition(BaseModel):
    name: str
    description: str
    inputSchema: Dict[str, Any]

class MCPToolCall(BaseModel):
    name: str
    arguments: Dict[str, Any] = Field(default_factory=dict)

class MCPContentItem(BaseModel):
    type: str = "text"
    text: str

class MCPToolResult(BaseModel):
    content: List[MCPContentItem]
    isError: bool = False
    metadata: Dict[str, Any] = Field(default_factory=dict)

class JSONRPCRequest(BaseModel):
    jsonrpc: str = "2.0"
    id: Optional[Union[str, int]] = None
    method: str
    params: Optional[Dict[str, Any]] = None

class JSONRPCResponse(BaseModel):
    jsonrpc: str = "2.0"
    id: Optional[Union[str, int]] = None
    result: Optional[Any] = None
    error: Optional[Dict[str, Any]] = None

class MCPClientConfig(BaseModel):
    name: str = "nexplay"
    version: str = "1.0.0"
    command: str = "python"
    args: List[str] = ["-m", "app.mcp.server"]
    env: Dict[str, str] = Field(default_factory=dict)
