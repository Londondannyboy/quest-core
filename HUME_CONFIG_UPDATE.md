# IMPORTANT: Update Your Hume Configuration

Based on the working implementation from ai-career-platform, you need to update your Hume Dashboard configuration:

## Current Configuration (Not Working)
```
https://quest-core.vercel.app/api/hume-clm-sse/chat/completions
```

## New Configuration (Should Work)
```
https://quest-core.vercel.app/api/hume-clm-sse
```

## Steps to Update:

1. Go to Hume Dashboard: https://app.hume.ai
2. Find your configuration (ID: 8f16326f-a45d-4433-9a12-890120244ec3)
3. Edit the Custom Language Model URL
4. Change it to: `https://quest-core.vercel.app/api/hume-clm-sse`
5. Save the configuration
6. Test in playground

## Key Differences from Working Implementation:

1. **Simpler URL Path**: No `/chat/completions` suffix needed
2. **Streaming in Controller**: All streaming logic inside the ReadableStream controller
3. **Exact SSE Format**: Matches the proven format from ai-career-platform
4. **Lower Token Limit**: 150 tokens for faster, more concise responses
5. **Error Handling**: Sends errors in SSE format too

## Why This Should Work:

The working ai-career-platform uses this exact pattern:
- URL: `/api/hume-clm-sse` (without `/chat/completions`)
- Same SSE format
- Same streaming approach
- Same headers

This is the proven pattern that works with Hume EVI.