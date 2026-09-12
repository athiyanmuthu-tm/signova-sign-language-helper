// Loads signs from signs.json and provides them to React components.

import { useEffect, useState } from 'react'

// Holds loaded data so we only fetch once.
let cache = null
let promise = null

// Load signs from the JSON file.
async function loadSigns() {
  // Already loaded? Return it.
  if (cache) return cache

  // Fetch already in progress? Return that.
  if (promise) return promise

  // Start the fetch.
  promise = fetch('/data/signs.json')
    .then((r) => r.json())
    .then((data) => {
      // Build practice list (alphabet + numbers with scoreable=true).
      const practice = [...data.alphabet, ...data.numbers].filter((s) => s.scoreable !== false)

      // Save to cache.
      cache = {
        alphabet: data.alphabet,
        numbers: data.numbers,
        words: data.words,
        fingerNames: data.fingerNames,
        groupMeta: data.groupMeta,
        practice,
        translate: practice,
      }
      return cache
    })

  return promise
}

// React hook to read signs from any component.
function useSigns() {
  const [signs, setSigns] = useState(cache)
  const [ready, setReady] = useState(!!cache)

  useEffect(() => {
    if (cache) return
    loadSigns().then((data) => {
      setSigns(data)
      setReady(true)
    })
  }, [])

  return {
    ready,
    alphabet: signs?.alphabet || [],
    numbers: signs?.numbers || [],
    words: signs?.words || [],
    scoreable: signs?.practice || [],
    translateable: signs?.translate || [],
    fingerNames: signs?.fingerNames || [],
    groupMeta: signs?.groupMeta || {},
    all: signs ? [...signs.alphabet, ...signs.numbers, ...signs.words] : [],
  }
}

export { useSigns }
