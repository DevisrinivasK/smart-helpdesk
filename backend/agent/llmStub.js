const process.env.STUB_MODE === 'true' ? true : false; // From env

class LLMProvider {
  async classify(text) {
    // Heuristic
    const lower = text.toLowerCase();
    let category = 'other';
    let confidence = 0.5;
    if (lower.includes('refund') || lower.includes('invoice') || lower.includes('charge')) {
      category = 'billing';
      confidence = lower.match(/(refund|invoice|charge)/g)?.length * 0.3 || 0.8;
    } else if (lower.includes('error') || lower.includes('bug') || lower.includes('stack')) {
      category = 'tech';
      confidence = lower.match(/(error|bug|stack)/g)?.length * 0.3 || 0.8;
    } else if (lower.includes('delivery') || lower.includes('shipment') || lower.includes('package')) {
      category = 'shipping';
      confidence = lower.match(/(delivery|shipment|package)/g)?.length * 0.3 || 0.8;
    }
    confidence = Math.min(1, confidence);
    return { predictedCategory: category, confidence };
  }

  async draft(text, articles) {
    let draftReply = `Based on your query: "${text}"\n\nSuggested resolution:\n`;
    const citations = articles.map(a => a._id);
    articles.forEach((a, i) => {
      draftReply += `${i+1}. From "${a.title}": ${a.body.substring(0, 100)}...\n`;
    });
    return { draftReply, citations };
  }
}

module.exports = new LLMProvider();