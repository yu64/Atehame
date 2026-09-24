import EditableList from "@src/components/EditableList";
import MainContent from "@src/components/MainContent";
import SchemaFieldEditor from "@src/components/SchemaFieldEditor";
import { createSchemaField, type SchemaField } from "@src/models/DataSchema";
import { schemaAtom } from "@src/store/schema";
import { useAtom } from "jotai";
import { navigate } from "vike/client/router";


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
    <MainContent>
      {/* <section>
        <Collapse title="このページは？">
          レイアウトに割り当てる値のカラムやデータ型を定義するページです。
        </Collapse>
      </section> */}
      <section className="flex flex-wrap gap-4 mt-4">
        <button
          type="button"
          className="atehame-btn-secondary pl-2 pr-4"
          onClick={addField}
        >
          <span className="i-lucide-plus size-6 shrink-0" aria-hidden="true" />
          項目を追加
        </button>
        {/* <button className="atehame-btn-secondary">インポート</button> */}
        {/* <button className="atehame-btn-secondary">エクスポート</button> */}
        <button
          type="button"
          className="atehame-btn-primary ml-auto"
          onClick={() => navigate('/edit/layout')}
        >
          次へ
        </button>
      </section>
      <section className="mt-4">
        <EditableList
          items={schema.fields}
          getKey={field => field.id}
          dataFactory={createSchemaField}
          label={(_, index) => `${index + 1}`}
          onChange={fields => setSchema(current => ({ ...current, fields }))}
        >
          {(field) => {
            return <SchemaFieldEditor value={field} onChange={updateField}/>;
          }}
        </EditableList>
      </section>
    </MainContent>
  );
}
