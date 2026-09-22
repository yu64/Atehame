import Collapse from "@src/components/Collapse";
import EditableList from "@src/components/EditableList";
import SchemaCard from "@src/components/SchemaCard";
import React from "react";


export default function Page() {

  return (
    <React.Fragment>
      {/* <section>
        <Collapse title="このページは？">
          レイアウトに割り当てる値のカラムやデータ型を定義するページです。
        </Collapse>
      </section> */}
      <section className="flex flex-row gap-4 mt-4">
        <button className="atehame-btn-primary">スキーマを追加</button>
        <button className="atehame-btn-secondary">インポート</button>
        <button className="atehame-btn-secondary">エクスポート</button>
      </section>
      <section>
        <EditableList
          items={[1, 2, 3]}
          factory={i => i + 1}
          label={i => `${i}`}
          onChange={(items) => console.log(items)}
        >
          {(i) => {
            return <SchemaCard/>;
          }}
        </EditableList>
      </section>
    </React.Fragment>
  );
}