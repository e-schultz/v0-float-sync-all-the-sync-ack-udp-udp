"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Database, Search, AlertCircle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ChromaBrowserProps {
  connector: any
  collections: any[]
}

export function ChromaBrowser({ connector, collections }: ChromaBrowserProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
  const [collectionData, setCollectionData] = useState<any>(null)
  const [queryText, setQueryText] = useState("")
  const [queryResults, setQueryResults] = useState<any>(null)

  const filteredCollections = searchQuery
    ? collections.filter((collection) => collection.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : collections

  const handleCollectionClick = async (collectionName: string) => {
    setSelectedCollection(collectionName)
    setLoading(true)
    setError(null)

    try {
      const data = await connector.peekCollection(collectionName)
      setCollectionData(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleQuery = async () => {
    if (!selectedCollection || !queryText) return

    setLoading(true)
    setError(null)

    try {
      const results = await connector.queryCollection(selectedCollection, [queryText], 5)
      setQueryResults(results)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <div className="relative mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search collections..."
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
          {filteredCollections.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">No collections found</div>
          ) : (
            <div className="p-4 space-y-1">
              {filteredCollections.map((collection) => (
                <Button
                  key={collection.name}
                  variant="ghost"
                  className={`w-full justify-start ${selectedCollection === collection.name ? "bg-muted" : ""}`}
                  onClick={() => handleCollectionClick(collection.name)}
                >
                  <Database className="h-4 w-4 mr-2 text-purple-500" />
                  {collection.name}
                  <Badge variant="outline" className="ml-auto">
                    {collection.count || 0}
                  </Badge>
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <div>
        <Card>
          <CardContent className="p-4">
            {selectedCollection ? (
              <Tabs defaultValue="peek">
                <TabsList className="mb-4 w-full">
                  <TabsTrigger value="peek">Peek Collection</TabsTrigger>
                  <TabsTrigger value="query">Query Collection</TabsTrigger>
                </TabsList>

                <TabsContent value="peek">
                  <div className="space-y-4">
                    <h3 className="font-medium">{selectedCollection}</h3>

                    <ScrollArea className="h-[350px] rounded-md border bg-muted p-4">
                      {loading ? (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : collectionData ? (
                        <div className="space-y-4">
                          {collectionData.ids?.map((id: string, index: number) => (
                            <div key={id} className="p-3 rounded-md bg-card border">
                              <div className="text-xs text-muted-foreground mb-1">ID: {id}</div>
                              <div className="text-sm">
                                {collectionData.documents?.[index] || "No document content"}
                              </div>
                              {collectionData.metadatas?.[index] && (
                                <div className="mt-2 pt-2 border-t text-xs">
                                  <div className="font-medium mb-1">Metadata:</div>
                                  <pre className="overflow-x-auto">
                                    {JSON.stringify(collectionData.metadatas[index], null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          No data available
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </TabsContent>

                <TabsContent value="query">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Query Text</label>
                      <div className="flex space-x-2">
                        <Input
                          value={queryText}
                          onChange={(e) => setQueryText(e.target.value)}
                          placeholder="Enter your query..."
                        />
                        <Button onClick={handleQuery} disabled={loading || !queryText}>
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                        </Button>
                      </div>
                    </div>

                    <ScrollArea className="h-[300px] rounded-md border bg-muted p-4">
                      {loading ? (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : queryResults ? (
                        <div className="space-y-4">
                          {queryResults.ids?.[0]?.map((id: string, index: number) => (
                            <div key={id} className="p-3 rounded-md bg-card border">
                              <div className="flex justify-between mb-1">
                                <div className="text-xs text-muted-foreground">ID: {id}</div>
                                <Badge variant="outline">
                                  Score: {queryResults.distances?.[0]?.[index]?.toFixed(4) || "N/A"}
                                </Badge>
                              </div>
                              <div className="text-sm">
                                {queryResults.documents?.[0]?.[index] || "No document content"}
                              </div>
                              {queryResults.metadatas?.[0]?.[index] && (
                                <div className="mt-2 pt-2 border-t text-xs">
                                  <div className="font-medium mb-1">Metadata:</div>
                                  <pre className="overflow-x-auto">
                                    {JSON.stringify(queryResults.metadatas[0][index], null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          Enter a query to search this collection
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                Select a collection to view its data
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
