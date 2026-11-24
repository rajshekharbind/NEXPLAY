import json
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_mcp_tools_discovery(async_client: AsyncClient):
    """Verify all 10+ native entertainment MCP tools are registered with schemas."""
    res = await async_client.get("/api/v1/mcp/tools")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    tools = body["data"]
    assert len(tools) >= 11

    tool_names = [t["name"] for t in tools]
    expected_tools = [
        "nexplay_search_catalog",
        "nexplay_get_content_details",
        "nexplay_list_platforms",
        "nexplay_get_platform_details",
        "nexplay_ai_recommend",
        "nexplay_get_mood_presets",
        "nexplay_get_featured_spotlight",
        "nexplay_manage_watchlist",
        "nexplay_check_availability",
        "nexplay_get_subscription_plans",
        "nexplay_check_wallet_balance"
    ]
    for expected in expected_tools:
        assert expected in tool_names, f"Expected MCP tool '{expected}' not found"

    # Verify input schema structure
    search_tool = next(t for t in tools if t["name"] == "nexplay_search_catalog")
    assert search_tool["inputSchema"]["type"] == "object"
    assert "query" in search_tool["inputSchema"]["properties"]

@pytest.mark.asyncio
async def test_mcp_tool_execution_catalog_and_details(async_client: AsyncClient):
    """Test executing catalog search and detail lookup tools via MCP."""
    # 1. Execute nexplay_search_catalog
    search_res = await async_client.post(
        "/api/v1/mcp/execute",
        json={
            "name": "nexplay_search_catalog",
            "arguments": {"query": "Interstellar", "limit": 2}
        }
    )
    assert search_res.status_code == 200
    search_data = search_res.json()["data"]
    assert search_data["isError"] is False
    parsed_content = json.loads(search_data["content"][0]["text"])
    assert parsed_content["total_matches"] >= 1
    assert parsed_content["results"][0]["title"] == "Interstellar"

    # 2. Execute nexplay_get_content_details
    detail_res = await async_client.post(
        "/api/v1/mcp/execute",
        json={
            "name": "nexplay_get_content_details",
            "arguments": {"slug_or_id": "interstellar"}
        }
    )
    assert detail_res.status_code == 200
    detail_data = detail_res.json()["data"]
    assert detail_data["isError"] is False
    detail_json = json.loads(detail_data["content"][0]["text"])
    assert detail_json["title"] == "Interstellar"
    assert len(detail_json["streaming_options"]) >= 1

@pytest.mark.asyncio
async def test_mcp_tool_execution_platforms_and_availability(async_client: AsyncClient):
    """Test platform listing and cross-platform availability checks."""
    # 1. List OTT platforms
    plat_res = await async_client.post(
        "/api/v1/mcp/execute",
        json={
            "name": "nexplay_list_platforms",
            "arguments": {"category": "ott"}
        }
    )
    assert plat_res.status_code == 200
    plat_json = json.loads(plat_res.json()["data"]["content"][0]["text"])
    assert plat_json["total_platforms"] >= 15

    # 2. Check title availability with deep links
    avail_res = await async_client.post(
        "/api/v1/mcp/execute",
        json={
            "name": "nexplay_check_availability",
            "arguments": {"title_or_slug": "Interstellar"}
        }
    )
    assert avail_res.status_code == 200
    avail_json = json.loads(avail_res.json()["data"]["content"][0]["text"])
    assert avail_json["title"] == "Interstellar"
    assert len(avail_json["streaming_destinations"]) >= 1
    assert "direct_stream_url" in avail_json["streaming_destinations"][0]

@pytest.mark.asyncio
async def test_mcp_tool_execution_ai_recommend(async_client: AsyncClient):
    """Test AI recommendation generation through MCP."""
    rec_res = await async_client.post(
        "/api/v1/mcp/execute",
        json={
            "name": "nexplay_ai_recommend",
            "arguments": {"prompt": "mind-bending sci-fi under 2 hours", "mood": "mind-bending", "limit": 2}
        }
    )
    assert rec_res.status_code == 200
    rec_json = json.loads(rec_res.json()["data"]["content"][0]["text"])
    assert len(rec_json["recommendations"]) >= 1
    assert "reasoning" in rec_json["recommendations"][0]

@pytest.mark.asyncio
async def test_mcp_jsonrpc_gateway(async_client: AsyncClient):
    """Test standard JSON-RPC 2.0 protocol endpoint for MCP clients."""
    # 1. Initialize
    init_res = await async_client.post(
        "/api/v1/mcp/rpc",
        json={"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}}
    )
    assert init_res.status_code == 200
    init_body = init_res.json()
    assert init_body["id"] == 1
    assert "serverInfo" in init_body["result"]
    assert init_body["result"]["serverInfo"]["name"] == "nexplay-mcp-server"

    # 2. Tools list over JSON-RPC
    list_res = await async_client.post(
        "/api/v1/mcp/rpc",
        json={"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}}
    )
    assert list_res.status_code == 200
    list_body = list_res.json()
    assert list_body["id"] == 2
    assert len(list_body["result"]["tools"]) >= 11

    # 3. Tool call over JSON-RPC
    call_res = await async_client.post(
        "/api/v1/mcp/rpc",
        json={
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/call",
            "params": {
                "name": "nexplay_get_mood_presets",
                "arguments": {}
            }
        }
    )
    assert call_res.status_code == 200
    call_body = call_res.json()
    assert call_body["id"] == 3
    assert call_body["result"]["isError"] is False

@pytest.mark.asyncio
async def test_mcp_client_configuration(async_client: AsyncClient):
    """Test retrieving configuration snippets for Claude Desktop and Cursor."""
    res = await async_client.get("/api/v1/mcp/config")
    assert res.status_code == 200
    data = res.json()["data"]
    assert "claude_desktop" in data
    assert "cursor" in data
    assert "mcpServers" in data["claude_desktop"]
    assert "nexplay" in data["claude_desktop"]["mcpServers"]
