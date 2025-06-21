import { useState } from "react";
import { Button } from "@/components/ui/button";

interface DiagnosticResult {
  collectionId: number;
  totalCards: number;
  loadTimeMs: number;
  sampleCards: Array<{ id: number; reference: string; playerName: string | null }>;
  timestamp: string;
}

interface HealthResult {
  status: string;
  database?: string;
  cardsCount?: number;
  performanceMs?: number;
}

export function ProductionDiagnostic() {
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [healthResult, setHealthResult] = useState<HealthResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostic = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("🔍 Running production diagnostic...");
      
      // Test health endpoint
      const healthResponse = await fetch("/api/health");
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setHealthResult(healthData);
        console.log("Health check result:", healthData);
      }
      
      // Test collection diagnostic
      const diagnosticResponse = await fetch("/api/collections/1/diagnostic");
      if (diagnosticResponse.ok) {
        const diagnosticData = await diagnosticResponse.json();
        setDiagnosticResult(diagnosticData);
        console.log("Diagnostic result:", diagnosticData);
      } else {
        throw new Error(`Diagnostic failed: ${diagnosticResponse.status}`);
      }
      
    } catch (err) {
      console.error("Diagnostic error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const testDirectCardLoad = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("🔍 Testing direct card load...");
      const startTime = Date.now();
      
      const response = await fetch("/api/collections/1/cards");
      const loadTime = Date.now() - startTime;
      
      if (response.ok) {
        const cards = await response.json();
        console.log(`✅ Direct load successful: ${cards.length} cards in ${loadTime}ms`);
        
        setDiagnosticResult({
          collectionId: 1,
          totalCards: cards.length,
          loadTimeMs: loadTime,
          sampleCards: cards.slice(0, 3).map((c: any) => ({
            id: c.id,
            reference: c.reference,
            playerName: c.playerName
          })),
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
    } catch (err) {
      console.error("Direct load error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 p-4 rounded-lg shadow-lg text-white z-50 max-w-md">
      <h3 className="text-sm font-bold mb-2">🔧 Diagnostic Production</h3>
      
      <div className="space-y-2 text-xs">
        <Button 
          onClick={runDiagnostic} 
          disabled={loading}
          className="w-full text-xs h-8"
        >
          {loading ? "Test en cours..." : "Test Complet"}
        </Button>
        
        <Button 
          onClick={testDirectCardLoad} 
          disabled={loading}
          className="w-full text-xs h-8"
          variant="outline"
        >
          {loading ? "Chargement..." : "Test Direct API"}
        </Button>
      </div>

      {error && (
        <div className="mt-2 p-2 bg-red-900 rounded text-xs">
          ❌ Erreur: {error}
        </div>
      )}

      {healthResult && (
        <div className="mt-2 p-2 bg-green-900 rounded text-xs">
          <div>Status: {healthResult.status}</div>
          {healthResult.cardsCount && <div>Cartes: {healthResult.cardsCount}</div>}
          {healthResult.performanceMs && <div>Perf: {healthResult.performanceMs}ms</div>}
        </div>
      )}

      {diagnosticResult && (
        <div className="mt-2 p-2 bg-blue-900 rounded text-xs">
          <div>Collection: {diagnosticResult.collectionId}</div>
          <div>Cartes: {diagnosticResult.totalCards}</div>
          <div>Temps: {diagnosticResult.loadTimeMs}ms</div>
          <div className="text-xs opacity-75">
            {diagnosticResult.timestamp}
          </div>
        </div>
      )}
    </div>
  );
}