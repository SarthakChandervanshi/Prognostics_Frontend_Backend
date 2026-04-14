import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Literature } from "@/lib/types";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export default function ComparisonTable({ data }: { data: Literature }) {
  return (
    <div className="rounded-xl border border-border/80 bg-card/40 shadow-sm">
      <Table className="table-fixed">
        <TableHeader className="bg-muted/25">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[70px] px-4 py-3 whitespace-normal">Rank</TableHead>
            <TableHead className="px-4 py-3 whitespace-normal">Model / Source</TableHead>
            <TableHead className="px-4 py-3 whitespace-normal">NASA score</TableHead>
            <TableHead className="px-4 py-3 whitespace-normal">RMSE</TableHead>
            <TableHead className="px-4 py-3 whitespace-normal">Status</TableHead>
            <TableHead className="px-4 py-3 whitespace-normal">Link / Advantage</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.entries.map((row) => (
            <TableRow key={`${row.rank}-${row.model}`} className="hover:bg-muted/20">
              <TableCell className="px-4 py-3 align-top font-medium whitespace-normal">
                {row.rank}
              </TableCell>
              <TableCell className="px-4 py-3 align-top break-words whitespace-normal">
                <p className="font-medium">{row.model}</p>
                {row.source ? (
                  <p className="text-sm text-muted-foreground">{row.source}</p>
                ) : null}
              </TableCell>
              <TableCell className="px-4 py-3 align-top whitespace-normal">
                {row.nasa_score.toFixed(2)}
              </TableCell>
              <TableCell className="px-4 py-3 align-top whitespace-normal">
                {row.rmse.toFixed(2)}
              </TableCell>
              <TableCell className="px-4 py-3 align-top whitespace-normal">
                <Badge variant="secondary" className="border border-primary/30 bg-primary/10">
                  {row.status}
                </Badge>
              </TableCell>
              <TableCell className="px-4 py-3 align-top text-sm break-words whitespace-normal">
                <Link
                  href={row.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                >
                  {row.status === "Proposed" ? "Open GitHub" : "Open paper"}
                  <ExternalLink className="size-3.5" />
                </Link>
                <p className="mt-1 text-muted-foreground">{row.advantage}</p>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
