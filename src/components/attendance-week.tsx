import { formatClock, STATUS_INFO, summaryText, type AttendanceDay, type AttendanceSummary } from "@/lib/attendance";
import { shortDate } from "@/lib/feedback";

// Tabela tipo "folha de ponto" da semana: dia, treino, check-in, check-out e status.
export default function AttendanceWeek({ days, summary }: { days: AttendanceDay[]; summary: AttendanceSummary }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">{summaryText(summary)}</p>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900">
            <tr>
              <th scope="col" className="px-2 py-2 font-medium">Dia</th>
              <th scope="col" className="px-2 py-2 font-medium">Treino</th>
              <th scope="col" className="px-2 py-2 font-medium">Check-in</th>
              <th scope="col" className="px-2 py-2 font-medium">Check-out</th>
              <th scope="col" className="px-2 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {days.flatMap((d) => {
              const dayCell = (
                <th scope="row" className="whitespace-nowrap px-2 py-2 font-medium">
                  {d.weekday.short}
                  <span className="block text-[10px] font-normal text-zinc-500">{shortDate(d.date)}</span>
                </th>
              );
              if (d.sessions.length === 0) {
                return [
                  <tr key={d.date} className={`border-t border-zinc-200 dark:border-zinc-800 ${d.planned ? "" : "bg-zinc-50/60 dark:bg-zinc-900/40"}`}>
                    {dayCell}
                    <td className="px-2 py-2 text-zinc-400">—</td>
                    <td className="px-2 py-2 text-zinc-400">—</td>
                    <td className="px-2 py-2 text-zinc-400">—</td>
                    <td className={`whitespace-nowrap px-2 py-2 font-medium ${STATUS_INFO[d.status].cls}`}>
                      {STATUS_INFO[d.status].label}
                    </td>
                  </tr>,
                ];
              }
              return d.sessions.map((s, i) => (
                <tr key={s.id} className={i === 0 ? "border-t border-zinc-200 dark:border-zinc-800" : ""}>
                  {i === 0 ? dayCell : <td />}
                  <td className="px-2 py-2">{s.workout_name_snapshot}</td>
                  <td className="px-2 py-2 tabular-nums">{formatClock(s.started_at)}</td>
                  <td className="px-2 py-2 tabular-nums">{formatClock(s.finished_at)}</td>
                  <td className={`whitespace-nowrap px-2 py-2 font-medium ${STATUS_INFO[s.dayStatus].cls}`}>
                    {STATUS_INFO[s.dayStatus].label}
                    {!d.planned && s.dayStatus === "concluido" && (
                      <span className="block text-[10px] font-normal text-zinc-500">dia extra</span>
                    )}
                  </td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
