import React from 'react';
import allCases from '@/src/data/cases.json';
import Link from 'next/link';

// We define exactly what a 'Case' looks like here
interface Case {
  slug: string;
  title: string;
  dateDecided: string;
  docketNo: string;
  court: string;
}

export default function ArchivePage() {
  // We tell TypeScript: "Treat allCases as a list of Cases"
  const cases = allCases as Case[];

  // Sort: Newest cases first
  const sortedCases = [...cases].sort((a, b) => 
    new Date(b.dateDecided).getTime() - new Date(a.dateDecided).getTime()
  );

  const years = Array.from(new Set(sortedCases.map(c => new Date(c.dateDecided).getFullYear()))).sort((a, b) => b - a);

  return (
    <main className="max-w-[1600px] mx-auto p-8 bg-[#EEEDEB] min-h-screen">
      <header className="mb-12 border-b border-[#000000] pb-2 text-left">
        <h1 className="font-mono text-3xl uppercase tracking-tighter">Archive</h1>
      </header>

      <div className="space-y-16">
        {years.length > 0 ? (
          years.map(year => (
            <section key={year} className="space-y-8">
              <h2 className="font-mono text-xl border-b border-black/10 pb-1 text-gray-400">
                VOLUME {year}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
                {[...Array(12)].map((_, i) => {
                  const monthIndex = 11 - i;
                  const monthName = new Date(0, monthIndex).toLocaleString('en-US', { month: 'long' });
                  const casesInMonth = sortedCases.filter(c => {
                    const d = new Date(c.dateDecided);
                    return d.getFullYear() === year && d.getMonth() === monthIndex;
                  });

                  if (casesInMonth.length === 0) return null;

                  return (
                    <div key={monthName} className="space-y-4">
                      <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
                        {monthName}
                      </h3>
                      <ul className="space-y-1">
                        {casesInMonth.map(c => (
                          <li key={c.slug}>
                            <Link href={`/cases/${c.slug}`} className="group block py-2 border-b border-black/5">
                              <div className="text-[14px] font-sans font-medium group-hover:bg-black group-hover:text-white px-1 transition-colors">
                                {c.title}
                              </div>
                              <div className="text-[9px] uppercase tracking-wider opacity-50 mt-1 px-1">
                                {c.docketNo}
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        ) : (
          <div className="font-mono text-gray-400 uppercase tracking-widest text-center py-20">
            [ No documents found in archive ]
          </div>
        )}
      </div>
    </main>
  );
}