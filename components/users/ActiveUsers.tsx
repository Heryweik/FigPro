import { useOthers, useSelf } from "@/liveblocks.config";
import { Avatar } from "./Avatar";
import styles from "./index.module.css";
import { generateKey } from "crypto";
import { generateRandomName } from "@/lib/utils";
import { useMemo } from "react";

export default function ActiveUsers() {
  const users = useOthers();
  const currentUser = useSelf();
  const hasMoreUsers = users.length > 3;

  // Este hook nos permite memorizar el componente, de esta forma solo se renderiza cuando cambia la longitud de los usuarios, exactamento en este caso no sirva para asegurarnos que al movel el cursor no cambie el color de los avatar
  const memorizedUsers = useMemo(() => {
    return (
      <div className="flex  items-center justify-center gap-1 py-2">
        <div className="flex pl-3">
          {currentUser && (
            <Avatar
              name="You"
              otherStyles="border-[3px] border-primary-green"
            />
          )}

          {/* Muestra los primero 3 usuarios */}
          {users.slice(0, 3).map(({ connectionId }) => {
            return (
              <Avatar
                key={connectionId}
                name={generateRandomName()}
                otherStyles="-ml-3"
              />
            );
          })}

          {hasMoreUsers && (
            <div className={styles.more}>+{users.length - 3}</div>
          )}
        </div>
      </div>
    );
  }, [users.length]);

  return memorizedUsers;
}
