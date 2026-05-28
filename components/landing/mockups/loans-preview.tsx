import { BrowserFrame } from './browser-frame';

const rows = [
  {
    client: 'Maria Santos',
    type: 'Lot Title',
    principal: '₱250,000',
    status: 'Active',
    due: 'Jun 12',
  },
  {
    client: 'Juan Dela Cruz',
    type: 'OR/CR',
    principal: '₱180,000',
    status: 'Active',
    due: 'Jun 18',
  },
  {
    client: 'Ana Reyes',
    type: 'Agent',
    principal: '₱95,000',
    status: 'Past Due',
    due: 'May 02',
  },
  {
    client: 'Carlos Mendoza',
    type: 'Lot Title',
    principal: '₱420,000',
    status: 'Active',
    due: 'Jul 01',
  },
];

export function LoansPreview() {
  return (
    <BrowserFrame title="loans">
      <div className="p-4 sm:p-5 space-y-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            Portfolio
          </p>
          <h3 className="text-sm font-bold">Loans</h3>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border/50">
          <table className="w-full min-w-[280px] text-left text-[9px]">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-2.5 py-2 font-medium">Client</th>
                <th className="px-2 py-2 font-medium">Type</th>
                <th className="px-2 py-2 font-medium">Principal</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium">Due</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.client}
                  className="border-t border-border/40 bg-card"
                >
                  <td className="px-2.5 py-2 font-medium">{row.client}</td>
                  <td className="px-2 py-2">{row.type}</td>
                  <td className="px-2 py-2 font-semibold tabular-nums">
                    {row.principal}
                  </td>
                  <td className="px-2 py-2">
                    <span
                      className={
                        row.status === 'Past Due'
                          ? 'rounded-md bg-chart-3/15 px-1.5 py-0.5 text-chart-3 font-medium'
                          : 'rounded-md bg-chart-2/15 px-1.5 py-0.5 text-chart-2 font-medium'
                      }
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-muted-foreground">{row.due}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </BrowserFrame>
  );
}
