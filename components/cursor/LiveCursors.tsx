
import Cursor from "./Cursor";
import { COLORS } from "@/constants";
import { useOthers } from "@/liveblocks.config";

// Obtiene la presencia de los otros usuarios y renderiza los cursores
export default function LiveCursors() {
    // Obtenemos la lista de cursores de los otros usuarios, si no hay presencia no se muestra el cursor
    // Estos son hooks de liveblocks que nos permiten obtener la presencia de los otros usuarios
  const others = useOthers();
  
  return others.map(({ connectionId, presence }) => {
    if (!presence?.cursor) return null;

    return (
      <Cursor
        key={connectionId}
        color={COLORS[Number(connectionId) % COLORS.length]}
        x={presence.cursor.x}
        y={presence.cursor.y}
        message={presence.message || ""}
      />
    );
  });
}
