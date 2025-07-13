'use client'

import { useState, useEffect } from 'react'
import { useVoice } from '@humeai/voice-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2,
  Mic,
  MicOff,
  WifiOff,
  Wifi
} from 'lucide-react'

export default function VoiceDebugPage() {
  const { connect, disconnect, status, messages, error } = useVoice()
  const [envStatus, setEnvStatus] = useState<{
    apiKey: boolean
    configId: boolean
    openaiKey: boolean
  }>({ apiKey: false, configId: false, openaiKey: false })
  const [connectionLog, setConnectionLog] = useState<string[]>([])

  useEffect(() => {
    // Check environment variables
    setEnvStatus({
      apiKey: !!process.env.NEXT_PUBLIC_HUME_API_KEY,
      configId: !!process.env.NEXT_PUBLIC_HUME_CONFIG_ID,
      openaiKey: false // Can't check server-side env from client
    })
  }, [])

  useEffect(() => {
    // Log status changes
    const timestamp = new Date().toLocaleTimeString()
    setConnectionLog(prev => [...prev, `[${timestamp}] Status: ${status.value}`])
    
    if (error) {
      setConnectionLog(prev => [...prev, `[${timestamp}] Error: ${error.message}`])
    }
  }, [status.value, error])

  useEffect(() => {
    // Log messages
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      const timestamp = new Date().toLocaleTimeString()
      setConnectionLog(prev => [...prev, `[${timestamp}] Message: ${lastMessage.type}`])
    }
  }, [messages])

  const handleTestConnection = async () => {
    try {
      setConnectionLog(prev => [...prev, '--- Starting connection test ---'])
      await connect()
    } catch (err) {
      console.error('Connection failed:', err)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
      setConnectionLog(prev => [...prev, '--- Disconnected ---'])
    } catch (err) {
      console.error('Disconnect failed:', err)
    }
  }

  const getStatusIcon = (isValid: boolean) => {
    return isValid ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    )
  }

  const getConnectionStatusIcon = () => {
    switch (status.value) {
      case 'connected':
        return <Wifi className="h-5 w-5 text-green-600" />
      case 'connecting':
        return <Loader2 className="h-5 w-5 text-yellow-600 animate-spin" />
      case 'error':
        return <WifiOff className="h-5 w-5 text-red-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-slate-400" />
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Voice Integration Debug</h1>
        <p className="text-slate-600">Test and debug your Hume EVI connection</p>
      </div>

      <div className="grid gap-6">
        {/* Environment Status */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Configuration</CardTitle>
            <CardDescription>Checking required environment variables</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>NEXT_PUBLIC_HUME_API_KEY</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(envStatus.apiKey)}
                <Badge variant={envStatus.apiKey ? "default" : "destructive"}>
                  {envStatus.apiKey ? "Set" : "Missing"}
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>NEXT_PUBLIC_HUME_CONFIG_ID</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(envStatus.configId)}
                <Badge variant={envStatus.configId ? "default" : "destructive"}>
                  {envStatus.configId ? "Set" : "Missing"}
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>OPENAI_API_KEY (server-side)</span>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <Badge variant="outline">Check Vercel</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
            <CardDescription>Current Hume EVI connection state</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {getConnectionStatusIcon()}
                <span className="text-lg font-medium capitalize">{status.value}</span>
              </div>
              <div className="flex gap-2">
                {status.value !== 'connected' && status.value !== 'connecting' && (
                  <Button onClick={handleTestConnection}>
                    <Mic className="mr-2 h-4 w-4" />
                    Test Connection
                  </Button>
                )}
                {status.value === 'connected' && (
                  <Button variant="destructive" onClick={handleDisconnect}>
                    <MicOff className="mr-2 h-4 w-4" />
                    Disconnect
                  </Button>
                )}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                <h4 className="font-medium text-red-900 mb-1">Connection Error</h4>
                <p className="text-sm text-red-700">{error.message}</p>
              </div>
            )}

            {/* Connection Details */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Config ID:</span>
                <span className="font-mono text-xs">
                  {process.env.NEXT_PUBLIC_HUME_CONFIG_ID || 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">API Endpoint:</span>
                <span className="font-mono text-xs">api.hume.ai</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">CLM Endpoint:</span>
                <span className="font-mono text-xs">/api/hume-clm-sse/chat/completions</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connection Log */}
        <Card>
          <CardHeader>
            <CardTitle>Connection Log</CardTitle>
            <CardDescription>Real-time connection events and messages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              {connectionLog.length === 0 ? (
                <p className="text-slate-400">No events yet. Click &quot;Test Connection&quot; to start.</p>
              ) : (
                connectionLog.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Message History */}
        {messages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Message History</CardTitle>
              <CardDescription>Recent messages from the voice session</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {messages.slice(-10).map((msg, index) => (
                  <div key={index} className="p-3 bg-slate-50 rounded-lg text-sm">
                    <div className="flex justify-between mb-1">
                      <Badge variant="outline">{msg.type}</Badge>
                      <span className="text-xs text-slate-500">
                        {new Date().toLocaleTimeString()}
                      </span>
                    </div>
                    {(() => {
                      if ('message' in msg && msg.message) {
                        if (typeof msg.message === 'string') {
                          return <p className="text-slate-700">{msg.message}</p>
                        } else if ('content' in msg.message && msg.message.content) {
                          return <p className="text-slate-700">{msg.message.content}</p>
                        }
                      }
                      return null
                    })()}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Useful links and actions for debugging</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full" asChild>
              <a href="https://app.hume.ai" target="_blank" rel="noopener noreferrer">
                Open Hume Dashboard
              </a>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">
                Check Vercel Logs
              </a>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <a href="/voice-coach">
                Go to Voice Coach
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}