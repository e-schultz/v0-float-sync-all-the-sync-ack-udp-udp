"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, FolderOpen, FileText, ChevronRight, Search, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ObsidianBrowserProps {
  connector: any
}

export function ObsidianBrowser({ connector }: ObsidianBrowserProps) {
  const [loading, setLoading] = useState(true)
  const [currentPath, setCurrentPath] = useState("")
  const [files, setFiles] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFile, setSelectedFile] = useState<any>(null)
  const [fileContent, setFileContent] = useState<string>("")
  const [hasDispatches, setHasDispatches] = useState(false)
  const [dispatches, setDispatches] = useState<string[]>([])

  const loadFiles = async (path = "") => {
    setLoading(true)
    setError(null)
    try {
      const result = await connector.listFiles(path)
      setFiles(result.files || [])
      setCurrentPath(path)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileClick = async (file: any) => {
    if (file.type === "folder") {
      const newPath = currentPath ? `${currentPath}/${file.name}` : file.name
      loadFiles(newPath)
      return
    }

    setSelectedFile(file)
    setLoading(true)

    try {
      if (file.type === "file") {
        // Construct the proper file path
        const filePath = currentPath ? `${currentPath}/${file.name}` : file.name

        // Get the file content first
        const fileResponse = await connector.getFile(filePath)
        setFileContent(fileResponse.content || "")

        // Check if the file might contain FLOAT dispatches
        const floatPattern = /loat\.dispatch$$\{[\s\S]*?\}$$;/g
        const matches = fileResponse.content ? fileResponse.content.match(floatPattern) : null

        setHasDispatches(Boolean(matches && matches.length > 0))
        setDispatches(matches || [])
      } else {
        setFileContent("")
        setHasDispatches(false)
        setDispatches([])
      }
    } catch (err: any) {
      setError(err.message)
      setFileContent("")
      setHasDispatches(false)
      setDispatches([])
    } finally {
      setLoading(false)
    }
  }

  const navigateUp = () => {
    if (!currentPath) return

    const parts = currentPath.split("/")
    parts.pop()
    const newPath = parts.join("/")
    loadFiles(newPath)
  }

  const filteredFiles = searchQuery
    ? files.filter((file) => file.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : files

  useEffect(() => {
    loadFiles()
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Button variant="outline" size="sm" onClick={navigateUp} disabled={!currentPath || loading}>
            <FolderOpen className="h-4 w-4 mr-1" />
            Up
          </Button>

          <div className="text-sm font-medium overflow-hidden text-ellipsis whitespace-nowrap">
            {currentPath || "Root"}
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}

        <ScrollArea className="h-[400px] rounded-md border">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">No files found</div>
          ) : (
            <div className="p-4 space-y-1">
              {filteredFiles.map((file) => (
                <Button
                  key={file.name}
                  variant="ghost"
                  className={`w-full justify-start ${selectedFile?.name === file.name ? "bg-muted" : ""}`}
                  onClick={() => handleFileClick(file)}
                >
                  {file.type === "folder" ? (
                    <>
                      <FolderOpen className="h-4 w-4 mr-2 text-amber-500" />
                      {file.name}
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2 text-blue-500" />
                      {file.name}
                    </>
                  )}
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <div>
        <Card>
          <CardContent className="p-4">
            {selectedFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{selectedFile.name}</h3>
                  {hasDispatches && (
                    <Badge variant="secondary" className="bg-green-50 text-green-700">
                      {dispatches.length} FLOAT Dispatch{dispatches.length !== 1 ? "es" : ""}
                    </Badge>
                  )}
                </div>

                <ScrollArea className="h-[400px] rounded-md border bg-muted p-4">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <pre className="text-sm whitespace-pre-wrap">{fileContent}</pre>
                  )}
                </ScrollArea>

                {hasDispatches && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">FLOAT Dispatches</h4>
                    {dispatches.map((dispatch, index) => (
                      <div key={index} className="text-xs p-2 rounded bg-muted">
                        {dispatch.length > 100 ? `${dispatch.substring(0, 100)}...` : dispatch}
                      </div>
                    ))}
                    <Button size="sm" className="w-full">
                      Extract All Dispatches
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                Select a file to view its content
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
