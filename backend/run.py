#!/usr/bin/env python3
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=4010,
        reload=True,
        log_level="info",
        workers=4,  # Multiple worker processes
        loop="asyncio",  # Use asyncio event loop
        http="httptools",  # Faster HTTP parser
        ws="websockets",  # WebSocket support
        limit_concurrency=100,  # Allow concurrent requests
        limit_max_requests=1000,  # Restart workers after this many requests
        timeout_keep_alive=30,  # Keep-alive timeout
    )
