import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeProps {
  value: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
}

export default function Barcode({
  value,
  width = 2,
  height = 60,
  displayValue = true,
  fontSize = 12,
}: BarcodeProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      JsBarcode(svgRef.current, value, {
        format: 'CODE128',
        width,
        height,
        displayValue,
        fontSize,
        margin: 5,
        background: '#ffffff',
        lineColor: '#1D2129',
        font: 'Noto Sans SC',
      });
    }
  }, [value, width, height, displayValue, fontSize]);

  return <svg ref={svgRef} className="barcode-svg" />;
}
