/** Keep long summary values readable where two metric cards share a phone-width row. */
export function shouldCompactMetricValue(value: string, windowWidth: number): boolean {
  return windowWidth <= 430 && value.length > 9;
}
