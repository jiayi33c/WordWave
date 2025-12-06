export async function fetchRelatedWords(word) {
  try {
    // Fetch synonyms (rel_syn)
    const synResponse = await fetch(`https://api.datamuse.com/words?rel_syn=${word}&max=5`);
    const synData = await synResponse.json();
    
    // Fetch antonyms (rel_ant)
    const antResponse = await fetch(`https://api.datamuse.com/words?rel_ant=${word}&max=5`);
    const antData = await antResponse.json();
    
    return {
      word: word,
      synonyms: synData.map(item => item.word),
      antonyms: antData.map(item => item.word)
    };
  } catch (error) {
    console.error("Error fetching words:", error);
    return { word, synonyms: [], antonyms: [] };
  }
}

