# Inngest MCP Setup Guide

This guide explains how to use Inngest's Model Context Protocol (MCP) integration with Cursor for AI-assisted function testing and debugging.

## What is Inngest MCP?

The Inngest MCP integration allows Cursor (and other AI assistants) to:

- Test event-driven workflows locally
- Debug function failures with detailed traces
- Monitor execution in real-time
- Search Inngest documentation
- Send test events and verify function behavior

All of this happens locally with your dev server - no external services needed!

## Setup

### 1. Start Your Next.js Dev Server

In one terminal window:

```bash
cd apps/web
pnpm dev
```

This runs your Next.js app on `http://localhost:3000` with the Inngest API endpoint at `/api/inngest`.

### 2. Start the Inngest Dev Server

In another terminal window:

```bash
cd apps/web
pnpm dev:inngest
```

This starts the Inngest dev server which:

- Runs on `http://localhost:8288`
- Connects to your Next.js app at `http://localhost:3000/api/inngest`
- Exposes the MCP endpoint at `http://localhost:8288/mcp`

### 3. Configure Cursor MCP (One-time setup)

1. Open Cursor Settings (`Cmd + ,` on Mac)
2. Search for "MCP" in the settings
3. Add this configuration:

```json
{
  "mcpServers": {
    "inngest-dev": {
      "command": "curl",
      "args": [
        "-X",
        "POST",
        "http://127.0.0.1:8288/mcp",
        "-H",
        "Content-Type: application/json",
        "-d",
        "@-"
      ]
    }
  }
}
```

4. Restart Cursor for the changes to take effect

## Using MCP with Cursor

Once both servers are running and MCP is configured, you can ask Cursor to:

### Test Functions

```
"Test the sendWelcomeEmail function with a sample user event"
```

### Debug Failures

```
"The processPayment function is failing. Can you help debug it?"
```

### Send Test Events

```
"Send a test event for user/created with email test@example.com"
```

### Monitor Workflows

```
"Test the entire checkout workflow from start to finish"
```

### Search Documentation

```
"How do I add retries to an Inngest function?"
```

## Available Inngest Functions

Your current functions (defined in `src/lib/inngest/functions.ts`):

1. **sendWelcomeEmail** - Triggered by `user/created` event
2. **processPayment** - Triggered by `checkout/completed` event
3. **scheduleReminder** - Triggered by `reminder/scheduled` event

## MCP Tools Available

The Inngest MCP server provides these tools:

### Event Management

- `send_event` - Trigger functions with test events
- `list_functions` - See all available functions
- `invoke_function` - Execute functions directly

### Execution Monitoring

- `get_run_status` - Get detailed execution traces
- `poll_run_status` - Monitor runs until completion

### Documentation Access

- `grep_docs` - Search Inngest docs
- `read_doc` - Read complete documentation
- `list_docs` - Browse available docs

## Troubleshooting

### MCP Not Connecting

- Ensure both dev servers are running (Next.js and Inngest)
- Check that Inngest dev server is on port 8288: `http://localhost:8288`
- Restart Cursor after changing MCP configuration

### Functions Not Appearing

- Make sure your Next.js dev server is running on port 3000
- Check the Inngest dev server logs for connection errors
- Verify functions are exported in `src/app/api/inngest/route.ts`

### Environment Variables

Your Inngest keys should be in `apps/web/.env.local`:

```
INNGEST_SIGNING_KEY=your-signing-key
INNGEST_EVENT_KEY=your-event-key
```

## Resources

- [Inngest MCP Announcement](https://www.inngest.com/blog/announcing-dev-server-mcp)
- [Inngest Documentation](https://www.inngest.com/docs)
- [Model Context Protocol Spec](https://modelcontextprotocol.io/)
