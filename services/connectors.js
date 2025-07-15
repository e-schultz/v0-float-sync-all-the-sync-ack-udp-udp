class ObsidianMCPConnector {
  constructor(baseUrl = "https://floatsystems.ngrok.dev") {
    // ngrok http http://localhost:27123 --domain floatsystems.ngrok.dev
    this.baseUrl = baseUrl
    this.apiKey = "753eb87026457cc78d03c49b8fb44cbdd0defc9fec094d836cce107e1085a862"
  }

  async setApiKey(apiKey) {
    this.apiKey = apiKey
    return this.testConnection()
  }

  async testConnection() {
    try {
      const response = await this.request("/vault/")
      return {
        connected: true,
        files: response.files || [],
      }
    } catch (error) {
      console.log("Connection test error:", error)
      return {
        connected: false,
        error: error.message,
      }
    }
  }

  async request(endpoint, method = "GET", data = null) {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    }

    const options = {
      method,
      headers,
    }

    if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
      options.body = JSON.stringify(data)
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, options)

      if (!response.ok) {
        const errorText = await response.text().catch(() => "No error details")
        throw new Error(`Obsidian request failed: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        return response.json()
      } else {
        const text = await response.text()
        try {
          return JSON.parse(text)
        } catch (e) {
          return { content: text }
        }
      }
    } catch (error) {
      console.error(`Error in request to ${endpoint}:`, error)
      throw error
    }
  }

  // Vault operations
  async listFiles(directory = "") {
    const path = directory ? `/vault/${directory}` : "/vault/"
    return this.request(path)
  }

  async getFile(filename) {
    return this.request(`/vault/${filename}`)
  }

  async createFile(filename, content) {
    return this.request(`/vault/${filename}`, "PUT", { content })
  }

  async updateFile(filename, content) {
    return this.request(`/vault/${filename}`, "PUT", { content })
  }

  async deleteFile(filename) {
    return this.request(`/vault/${filename}`, "DELETE")
  }

  // FLOAT specific operations
  async getFloatDispatches() {
    return this.request("/vault/FLOAT.dispatch/")
  }

  async getFloatFolder(folder) {
    return this.request(`/vault/FLOAT.${folder}/`)
  }

  // Get the content of a file that might contain a FLOAT dispatch
  async checkForFloatDispatch(filename) {
    if (!filename) {
      return {
        hasDispatches: false,
        content: "",
      }
    }

    try {
      const fileResponse = await this.getFile(filename)

      if (fileResponse && fileResponse.content) {
        // Look for FLOAT dispatch patterns
        const floatPattern = /loat\.dispatch$$\{[\s\S]*?\}$$;/g
        const matches = fileResponse.content.match(floatPattern)

        if (matches && matches.length > 0) {
          return {
            hasDispatches: true,
            dispatches: matches,
            content: fileResponse.content,
          }
        }
      }

      return {
        hasDispatches: false,
        content: fileResponse?.content || "",
      }
    } catch (error) {
      console.error(`Error checking for FLOAT dispatch in ${filename}:`, error)
      return {
        hasDispatches: false,
        content: "",
        error: error.message,
      }
    }
  }
}

class ChromaConnector {
  constructor(baseUrl = "https://floatsystems-chroma.ngrok.dev") {
    // ngrok http http://localhost:8001 --domain floatsystems.ngrok.dev
    this.baseUrl = baseUrl
  }

  async testConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/heartbeat`, {
        headers: {
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      throw new Error(`Chroma connection error: ${error.message}`)
    }
  }

  async listCollections() {
    const response = await fetch(`${this.baseUrl}/collections`)
    return response.json()
  }

  async getCollection(name) {
    const response = await fetch(`${this.baseUrl}/collections/${name}`)
    return response.json()
  }

  async queryCollection(name, queryTexts, nResults = 10, where = null) {
    const response = await fetch(`${this.baseUrl}/collections/${name}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query_texts: queryTexts,
        n_results: nResults,
        where,
      }),
    })
    return response.json()
  }

  async peekCollection(name, limit = 5) {
    const response = await fetch(`${this.baseUrl}/peek/${name}?limit=${limit}`)
    return response.json()
  }
}

// Export both connectors
export const obsidianMCP = new ObsidianMCPConnector()
export const chroma = new ChromaConnector()
