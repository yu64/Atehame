import EditableList from "@src/components/EditableList";
import SchemaCard from "@src/components/SchemaCard";
import { createSchemaField, type SchemaField } from "@src/models/DataSchema";
import { schemaAtom } from "@src/store/schema";
import { useAtom } from "jotai";
import React from "react";


export default function Page() {
  const [schema, setSchema] = useAtom(schemaAtom);

  function updateField(value: SchemaField) {
    setSchema(current => ({
      ...current,
      fields: current.fields.map(field => field.id === value.id ? value : field),
    }));
  }

  function addField() {
    const field = createSchemaField();
    setSchema(current => ({ ...current, fields: [...current.fields, field] }));
  }

  return (
    <React.Fragment>
      {/* <section>
        <Collapse title="このページは？">
          レイアウトに割り当てる値のカラムやデータ型を定義するページです。
        </Collapse>
      </section> */}
      <section className="flex flex-row gap-4 mt-4">
        <button className="atehame-btn-primary" onClick={addField}>スキーマを追加</button>
        <button className="atehame-btn-secondary">インポート</button>
        <button className="atehame-btn-secondary">エクスポート</button>
      </section>
      <section>
        <EditableList
          items={schema.fields}
          getKey={field => field.id}
          dataFactory={createSchemaField}
          label={(_, index) => `${index + 1}`}
          onChange={fields => setSchema(current => ({ ...current, fields }))}
        >
          {(field) => {
            return <SchemaCard value={field} onChange={updateField}/>;
          }}
        </EditableList>
      </section>
    </React.Fragment>
  );
}
