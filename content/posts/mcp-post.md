---
title: "Model Context Protocol (MCP) an overview"
date: 2025-02-27
draft: false
tags: ["mcp", "tool"]
keywords: ["context", "tool-calling", "mcp"]
summary: "The Model Context Protocol (MCP) is an open standard introduced by Anthropic with the goal to standardize how AI applications (chatbots, IDE assistants, or custom agents) connect with external tools, data sources, and systems."
---

Think of it like USB for AI integrations. Before standards like USB, connecting peripherals required a mess of different ports and custom drivers. Similarly, integrating AI applications with external tools and systems is/was an "M×N problem".
If you have M different AI applications (Chat, RAG 1, custom agents, etc.) and N different tools/systems (GitHub, Slack, Asana, databases, etc.), you might need to build M×N different integrations. This leads to duplicated effort across teams, inconsistent implementations.

{{< figure src="/api.png" title="Architecture overview" >}}

MCP aims to simplify this by providing a common API and transforming this into an "M+N problem". Tool creators build N MCP servers (one for each system), while application developers build M MCP clients (one for each AI application). MCP defines a client-server architecture where:

- `Hosts`: Applications the user interacts with (e.g., Claude Desktop, an IDE like Cursor, a custom agent).
- `Clients`: External programs that expose Tools, Resources and Prompts via standard API to the AI model via the client.
- `Servers`: External programs that expose Tools, Resources and Prompts via standard API to the AI model via the client.

The current components of MCP servers include:

1. `Tools (Model-controlled):`: These are data sources that LLMs can access, similar to GET endpoints in a REST API. Resources provide data without performing significant computation, no side effects. Part of the context/request
2. `Resources (Application-controlled)`: Container runtime responsible for running containers
3. `Prompts (User-controlled):` These are pre-defined templates to use tools or resources in the most optimal way. Selected before running inference

{{< figure src="/overview.png" title="Overview" >}}

# How does MCP work?

MCP operates on the client-server model described earlier. Here’s a simplified flow:

{{< figure src="/architecture.png" title="MCP operate Server" >}}


1. `Initialization:` When a Host application starts it creates N MCP Clients, which exchange information about capabilities and protocol versions via a handshake.

2. `Discovery:` Clients requests what capabilities (Tools, Resources, Prompts) the server offers. The Server responds with a list and descriptions.

3. `Context Provision:` The Host application can now make resources and prompts available to the user or parses the tools into a LLM compatible format, e.g. JSON Function calling

4. `Invocation:` If the LLM determines it needs to use a Tool (e.g., based on the user's request like "What are the open issues in the 'X' repo?"), the Host directs the Client to send an invocation request to the appropriate Server.

5. `Execution:` The Server receives the request (e.g., fetch_github_issues with repo 'X'), executes the underlying logic (calls the GitHub API), and gets the result.

6. `Response:` The Server sends the result back to the Client.

7. `Completion:`  The Client relays the result to the Host, which incorporates it into the LLM's context, allowing the LLM to generate a final response for the user based on the fresh, external information.

## MCP server

MCP Servers are the bridge/API between the MCP world and the specific functionality of an external system (an API, a database, local files, etc.). They are essentially wrappers that expose these external capabilities according to the MCP specification.

Servers can be built in various languages (Python, TypeScript, Java, Rust, etc.) as long as they can communicate over the supported transports. Servers communicate with clients primarily via two methods:

- `stdio (Standard Input/Output)`: Used when Client and Server run on the same machines. This is simple and effective for local integrations (e.g., accessing local files or running a local script).
- `HTTP via SSE (Server-Sent Events)`: The Client connects to the Server via HTTP. After an initial setup, the Server can push messages (events) to the Client over a persistent connection using the SSE standard.

Example of how to build an MCP server with Python and [FastMCP](https://github.com/jlowin/fastmcp/tree/main):

```md
from fastmcp import FastMCP
 
# Create an MCP server
mcp = FastMCP("Demo")
 
# Add a tool, will be converted into JSON spec for function calling
@mcp.tool()
def add(a: int, b: int) -> int:
    """Add two numbers"""
    return a + b
 
# Add a data resource, e.g. displayed on new chats
@mcp.resource("greeting://{name}")
def get_greeting(name: str) -> str:
    """Get a personalized greeting"""
    return f"Hello, {name}!"
 
# Specific prompt templates for better use
@mcp.prompt()
def review_code(code: str) -> str:
    return f"Please review this code:\n\n{code}"
```

List of pre-build and community build MCP servers:

- [Awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers)
- [Servers](https://github.com/modelcontextprotocol/servers)
- [Managed MCP server](https://mcp.composio.dev/)

## MCP Clients

MCP Clients are part of Host applications (the IDE, chatbot, etc.) that manage the communication with a specific MCP Server.

- `Role:` Handle connection management, capability discovery, request forwarding, and response handling according to the MCP spec.
- `Examples of Hosts/Clients:` 
    - `UI Apps:` Claude Desktop, Microsoft Copilot Studio, LibreChat, Claude Code
    - `IDEs:` Cursor, Windsurf, Continue, Zed, Cline
    - `Custom Agents` (Python/TypeScript)
        - Firebase Genkit
        - LangGraph
        - OpenAI agents sdk

Example of how to build an MCP client with Python and mcp.

```md
from mcp import ClientSession, StdioServerParameters, types
from mcp.client.stdio import stdio_client
 
# Commands for running/connecting to MCP Server
server_params = StdioServerParameters(
    command="python",  # Executable
    args=["example_server.py"],  # Optional command line arguments
    env=None,  # Optional environment variables
)
 
async with stdio_client(server_params) as (read, write):
    async with ClientSession(
        read, write, sampling_callback=handle_sampling_message
    ) as session:
        # Initialize the connection
        await session.initialize()
 
        # List available prompts
        prompts = await session.list_prompts()
 
        # Get a prompt
        prompt = await session.get_prompt(
            "example-prompt", arguments={"arg1": "value"}
        )
 
        # List available resources
        resources = await session.list_resources()
 
        # List available tools
        tools = await session.list_tools()
 
        # Read a resource
        content, mime_type = await session.read_resource("file://some/path")
 
        # Call a tool
        result = await session.call_tool("tool-name", arguments={"arg1": "value"})
```

## Acknowledgements

This overview was compiled with the help of deep and manual research, drawing inspiration and information from several excellent resources, including:

- [MCP Overview](https://www.philschmid.de/mcp-introduction)
- [What is MCP](https://python.useinstructor.com/blog/2025/03/27/understanding-model-context-protocol-mcp/#openai-agent-sdk)