import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Ruler, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";

type Orientation = "vertical" | "horizontal";

type PresetRules = {
  betweenExternalX: number;
  beforeIfmsX: number;
  closingX: number;
};

const BASE_X = 8;

function getPresetRules(orientation: Orientation): PresetRules {
  if (orientation === "vertical") {
    return {
      betweenExternalX: 3,
      beforeIfmsX: 1,
      closingX: 0,
    };
  }

  return {
    betweenExternalX: 2,
    beforeIfmsX: 2,
    closingX: 1,
  };
}

export default function BrandComposerPage() {
  const [orientation, setOrientation] = useState<Orientation>("horizontal");
  const [brandCount, setBrandCount] = useState(3);
  const [gapInput, setGapInput] = useState("16,16");
  const [closingInput, setClosingInput] = useState("8");

  const preset = useMemo(() => getPresetRules(orientation), [orientation]);

  const minGaps = useMemo(() => {
    const normalized = Math.max(2, Math.min(8, brandCount));
    const gaps = Array.from({ length: normalized - 1 }, () => preset.betweenExternalX * BASE_X);

    if (orientation === "vertical") {
      gaps[gaps.length - 1] = preset.beforeIfmsX * BASE_X;
    }

    return gaps;
  }, [brandCount, orientation, preset]);

  const informedGaps = useMemo(() => {
    const values = gapInput
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((n) => Number.isFinite(n) && n >= 0);

    return minGaps.map((_, index) => values[index] ?? 0);
  }, [gapInput, minGaps]);

  const informedClosing = Number(closingInput);

  const validation = useMemo(() => {
    const gapFailures = minGaps
      .map((minimum, index) => ({
        index,
        minimum,
        value: informedGaps[index] ?? 0,
      }))
      .filter((item) => item.value < item.minimum);

    const closingMinimum = preset.closingX * BASE_X;
    const closingFail = orientation === "horizontal" && (!Number.isFinite(informedClosing) || informedClosing < closingMinimum);

    return {
      valid: gapFailures.length === 0 && !closingFail,
      gapFailures,
      closingFail,
      closingMinimum,
    };
  }, [informedClosing, informedGaps, minGaps, orientation, preset]);

  const exportComposition = () => {
    if (!validation.valid) return;
    const payload = {
      orientation,
      brands: Math.max(2, Math.min(8, brandCount)),
      gaps: informedGaps,
      closing: orientation === "horizontal" ? informedClosing : undefined,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "composicao-marcas-ifms.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-3 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">Compositor de Marcas</h1>
        <p className="text-sm text-slate-500 mt-1">Presets oficiais, guias visuais e validação de espaçamentos mínimos.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuração do layout</CardTitle>
          <CardDescription>Defina orientação, quantidade de marcas e valores de espaçamento para conferência.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Orientação</Label>
              <div className="flex gap-2">
                <Button variant={orientation === "horizontal" ? "default" : "outline"} onClick={() => setOrientation("horizontal")}>Horizontal</Button>
                <Button variant={orientation === "vertical" ? "default" : "outline"} onClick={() => setOrientation("vertical")}>Vertical</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-count">Quantidade de marcas (inclui IFMS)</Label>
              <Input id="brand-count" type="number" min={2} max={8} value={brandCount} onChange={(e) => setBrandCount(Number(e.target.value))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gaps">Distâncias entre marcas (px, separadas por vírgula)</Label>
            <Input id="gaps" value={gapInput} onChange={(e) => setGapInput(e.target.value)} placeholder="Ex: 16,16" />
          </div>

          {orientation === "horizontal" && (
            <div className="space-y-2">
              <Label htmlFor="closing">Espaçamento de encerramento (px)</Label>
              <Input id="closing" value={closingInput} onChange={(e) => setClosingInput(e.target.value)} />
            </div>
          )}

          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="secondary">1x = {BASE_X}px</Badge>
            {orientation === "vertical" ? (
              <>
                <Badge variant="outline">Entre marcas externas: {preset.betweenExternalX}x</Badge>
                <Badge variant="outline">Antes da IFMS: {preset.beforeIfmsX}x</Badge>
              </>
            ) : (
              <>
                <Badge variant="outline">Entre marcas: {preset.betweenExternalX}x</Badge>
                <Badge variant="outline">Encerramento: {preset.closingX}x</Badge>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Ruler className="w-4 h-4" />Guias visuais</CardTitle>
          <CardDescription>As guias em verde atendem ao mínimo. Guias em vermelho ficam abaixo da regra oficial.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border p-4 bg-slate-50 overflow-auto">
            <div className={`flex ${orientation === "vertical" ? "flex-col" : "flex-row"} items-center`}>
              {minGaps.map((minimum, index) => {
                const value = informedGaps[index] ?? 0;
                const ok = value >= minimum;
                return (
                  <div key={`gap-${index}`} className={`flex ${orientation === "vertical" ? "flex-col" : "flex-row"} items-center`}>
                    <div className="h-14 w-20 rounded border bg-white text-xs flex items-center justify-center">Marca {index + 1}</div>
                    <div
                      className={`relative ${orientation === "vertical" ? "w-10" : "h-10"} ${ok ? "text-emerald-600" : "text-red-600"}`}
                      style={orientation === "vertical" ? { height: `${Math.max(24, value)}px` } : { width: `${Math.max(24, value)}px` }}
                    >
                      <div className={`absolute ${orientation === "vertical" ? "left-1/2 -translate-x-1/2 w-px h-full" : "top-1/2 -translate-y-1/2 h-px w-full"} ${ok ? "bg-emerald-500" : "bg-red-500"}`} />
                      <div className={`absolute text-[10px] font-medium ${orientation === "vertical" ? "left-1/2 -translate-x-1/2 -top-5" : "top-1/2 -translate-y-1/2 -right-1 translate-x-full"}`}>
                        {value}px / min {minimum}px
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="h-14 w-20 rounded border bg-white text-xs flex items-center justify-center font-semibold">IFMS</div>

              {orientation === "horizontal" && (
                <div className="flex flex-row items-center">
                  <div
                    className={`relative h-10 ${validation.closingFail ? "text-red-600" : "text-emerald-600"}`}
                    style={{ width: `${Math.max(24, Number.isFinite(informedClosing) ? informedClosing : 0)}px` }}
                  >
                    <div className={`absolute top-1/2 -translate-y-1/2 h-px w-full ${validation.closingFail ? "bg-red-500" : "bg-emerald-500"}`} />
                    <div className="absolute top-1/2 -translate-y-1/2 -right-1 translate-x-full text-[10px] font-medium">
                      fim {informedClosing}px / min {validation.closingMinimum}px
                    </div>
                  </div>
                  <div className="h-14 w-10 rounded border border-dashed bg-white/70 text-[10px] flex items-center justify-center">Fim</div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {!validation.valid && (
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Exportação bloqueada por espaçamento mínimo</AlertTitle>
          <AlertDescription>
            Ajuste as distâncias abaixo do mínimo oficial antes de exportar.
          </AlertDescription>
        </Alert>
      )}

      <Button onClick={exportComposition} disabled={!validation.valid} className="gap-2">
        <Download className="w-4 h-4" /> Exportar composição
      </Button>
    </div>
  );
}
