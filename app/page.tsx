"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, FileText, Database, RefreshCw } from "lucide-react"
import { obsidianMCP, chroma } from "@/services/connectors"
import { ObsidianBrowser } from "@/components/obsidian-browser"
import { ChromaBrowser } from "@/components/chroma-browser"

export default function Dashboard() {
  const [obsidianStatus, setObsidianStatus] = useState<{
    loading: boolean
    connected: boolean
    error?: string
    files?: any[]
  }>({
    loading: true,
    connected: false,
  })

  const [chromaStatus, setChromaStatus] = useState<{
    loading: boolean
    connected: boolean
    error?: string
    collections?: any[]
  }>({
    loading: true,
    connected: false,
  })

  const [obsidianUrl, setObsidianUrl] = useState(obsidianMCP.baseUrl)
  const [obsidianApiKey, setObsidianApiKey] = useState(obsidianMCP.apiKey)
  const [chromaUrl, setChromaUrl] = useState(chroma.baseUrl)

  const testObsidianConnection = async () => {
    setObsidianStatus({ loading: true, connected: false })
    try {
      obsidianMCP.baseUrl = obsidianUrl
      await obsidianMCP.setApiKey(obsidianApiKey)
      const result = await obsidianMCP.testConnection()
      setObsidianStatus({
        loading: false,
        connected: result.connected,
        error: result.error,
        files: result.files,
      })
    } catch (error: any) {
      setObsidianStatus({
        loading: false,
        connected: false,
        error: error.message,
      })
    }
  }

  const testChromaConnection = async () => {
    setChromaStatus({ loading: true, connected: false })
    try {
      chroma.baseUrl = chromaUrl
      const heartbeat = await chroma.testConnection()
      const collections = await chroma.listCollections()
      setChromaStatus({
        loading: false,
        connected: true,
        collections: collections.collections,
      })
    } catch (error: any) {
      setChromaStatus({
        loading: false,
        connected: false,
        error: error.message,
      })
    }
  }

  useEffect(() => {
    testObsidianConnection()
    testChromaConnection()
  }, [])

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">FLOAT.sync Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <ConnectionCard
          title="Obsidian MCP"
          icon={<FileText className="h-6 w-6" />}
          status={obsidianStatus}
          url={obsidianUrl}
          setUrl={setObsidianUrl}
          apiKey={obsidianApiKey}
          setApiKey={setObsidianApiKey}
          testConnection={testObsidianConnection}
          hasApiKey={true}
        />

        <ConnectionCard
          title="Chroma DB"
          icon={<Database className="h-6 w-6" />}
          status={chromaStatus}
          url={chromaUrl}
          setUrl={setChromaUrl}
          testConnection={testChromaConnection}
          hasApiKey={false}
        />
      </div>

      <Tabs defaultValue="obsidian" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="obsidian">Obsidian Browser</TabsTrigger>
          <TabsTrigger value="chroma">Chroma Browser</TabsTrigger>
          <TabsTrigger value="dispatches">FLOAT Dispatches</TabsTrigger>
        </TabsList>

        <TabsContent value="obsidian">
          <Card>
            <CardHeader>
              <CardTitle>Obsidian Vault Browser</CardTitle>
              <CardDescription>Browse and search your Obsidian vault files</CardDescription>
            </CardHeader>
            <CardContent>
              {obsidianStatus.connected ? (
                <ObsidianBrowser connector={obsidianMCP} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Connect to Obsidian MCP to browse your vault
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chroma">
          <Card>
            <CardHeader>
              <CardTitle>Chroma Collections Browser</CardTitle>
              <CardDescription>Browse and search your vector database collections</CardDescription>
            </CardHeader>
            <CardContent>
              {chromaStatus.connected ? (
                <ChromaBrowser connector={chroma} collections={chromaStatus.collections || []} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Connect to Chroma DB to browse your collections
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dispatches">
          <Card>
            <CardHeader>
              <CardTitle>FLOAT Dispatches</CardTitle>
              <CardDescription>Manage your FLOAT dispatches across imprints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Connect to Obsidian MCP to view and manage your dispatches
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface ConnectionCardProps {
  title: string
  icon: React.ReactNode
  status: {
    loading: boolean
    connected: boolean
    error?: string
  }
  url: string
  setUrl: (url: string) => void
  apiKey?: string
  setApiKey?: (key: string) => void
  testConnection: () => void
  hasApiKey: boolean
}

function ConnectionCard({
  title,
  icon,
  status,
  url,
  setUrl,
  apiKey,
  setApiKey,
  testConnection,
  hasApiKey,
}: ConnectionCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          {icon}
          <CardTitle className="text-xl">{title}</CardTitle>
        </div>
        <StatusBadge status={status} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Server URL</label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="http://localhost:8000" />
        </div>

        {hasApiKey && setApiKey && (
          <div className="space-y-2">
            <label className="text-sm font-medium">API Key</label>
            <Input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              type="password"
              placeholder="Enter API key"
            />
          </div>
        )}

        {status.error && <div className="text-sm text-red-500 mt-2">Error: {status.error}</div>}
      </CardContent>
      <CardFooter>
        <Button onClick={testConnection} disabled={status.loading} className="w-full">
          {status.loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Test Connection
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

function StatusBadge({ status }: { status: { loading: boolean; connected: boolean } }) {
  if (status.loading) {
    return (
      <Badge variant="outline" className="flex items-center">
        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        Connecting
      </Badge>
    )
  }

  if (status.connected) {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center">
        <CheckCircle className="mr-1 h-3 w-3" />
        Connected
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center">
      <XCircle className="mr-1 h-3 w-3" />
      Disconnected
    </Badge>
  )
}
