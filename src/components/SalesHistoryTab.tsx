
'use client';

import React, { useState } from 'react';
import { MaterialSale, fmtNum, fmtUsd } from '@/types/market';
import { getElanthipediaUrl } from '@/lib/elanthipedia';

type Props = {
  sales: MaterialSale[];
};

export function SalesHistoryTab({ sales }: Props) {
  const [search, setSearch] = useState('');

  const filteredSales = sales.filter((sale) =>
    sale.material_name.toLowerCase().includes(search.toLowerCase().trim())
  );

  if (sales.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
        <h2 className="text-lg font-bold text-slate-200">
          Material Sales History
        </h2>
        <p className="text-sm text-slate-400 mt-2">
          No material sales have been recorded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-amber-400">
          Material Sales History
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Permanent records of completed material sales ({filteredSales.length} of {sales.length} transactions)
        </p>
      </div>

      {/* Sales History Material Search */}
      <div>
        <input
          type="text"
          placeholder="Search sales history by material..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
        />
      </div>

      <div className="overflow-x-auto border border-slate-800 rounded-xl">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-900 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Material</th>
              <th className="px-4 py-3">Variant</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Quality</th>
              <th className="px-4 py-3">Seller</th>
              <th className="px-4 py-3 text-right">Unit Price</th>
              <th className="px-4 py-3 text-right">Sale Total</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800">
            {filteredSales.length > 0 ? (
              filteredSales.map((sale) => (
                <tr key={sale.id} className="bg-slate-950 hover:bg-slate-900/70">
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400">
                    {new Date(sale.sold_at).toLocaleString()}
                  </td>

                  <td className="px-4 py-3 font-medium whitespace-nowrap">
                    <a
                      href={getElanthipediaUrl(sale.material_name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400 hover:text-amber-300 hover:underline"
                    >
                      {sale.material_name}
                    </a>
                  </td>

                  <td className="px-4 py-3 text-slate-300">
                    {sale.variant || '—'}
                  </td>

                  <td className="px-4 py-3 text-right tabular-nums">
                    {fmtNum(sale.quantity_sold)}
                  </td>

                  <td className="px-4 py-3 text-right tabular-nums">
                    {fmtNum(sale.quality)}
                  </td>

                  <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                    {sale.seller_handle}
                  </td>

                  <td className="px-4 py-3 text-right whitespace-nowrap text-xs">
                    {sale.sold_kronars != null && (
                      <div>{fmtNum(sale.sold_kronars)} PK</div>
                    )}
                    {sale.sold_usd != null && (
                      <div>{fmtUsd(sale.sold_usd)}</div>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right whitespace-nowrap font-semibold text-emerald-400 text-xs">
                    {sale.total_kronars != null && (
                      <div>{fmtNum(sale.total_kronars)} PK</div>
                    )}
                    {sale.total_usd != null && (
                      <div>{fmtUsd(sale.total_usd)}</div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-400">
                  No sales found for "{search}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
