import MainContent from "@src/app/MainContent";
import StepHeader from "@src/app/StepHeader";
import SchemaFieldEditor from "@src/features/schema/SchemaFieldEditor";
import { createSchemaField, type SchemaField } from "@src/features/schema/model";
import { schemaAtom } from "@src/features/schema/store";
import EditableList from "@src/shared/ui/EditableList";
import { useAtom } from "jotai";
import { navigate } from "vike/client/router";

export default function Page() {
  const [schema, setSchema] = useAtom(schemaAtom);

  function updateField(value: SchemaField) {
    setSchema(current => ({
      ...current,
      fields: current.fields.map(field => (field.id === value.id ? value : field)),
    }));
  }

  function addField() {
    const field = createSchemaField();
    setSchema(current => ({ ...current, fields: [...current.fields, field] }));
  }

  return (
    <>
      <StepHeader
        title="スキーマ"
        description={
          <>
            CSVで受け取るカラムの名前とデータ型を定義します。カラム名は加工の{" "}
            <code className="font-mono">input</code> で使います。
          </>
        }
        onNext={() => navigate("/edit/transform")}
      />
      <MainContent>
        <section className="flex flex-wrap gap-4 pt-4">
          <button type="button" className="atehame-btn-secondary pl-2 pr-4" onClick={addField}>
            <span className="i-lucide-plus size-6 shrink-0" aria-hidden="true" />
            項目を追加
          </button>
          {/* <button className="atehame-btn-secondary">インポート</button> */}
          {/* <button className="atehame-btn-secondary">エクスポート</button> */}
        </section>
        <section className="mt-4">
          <EditableList
            items={schema.fields}
            getKey={field => field.id}
            dataFactory={createSchemaField}
            label={(_, index) => `${index + 1}`}
            onChange={fields => setSchema(current => ({ ...current, fields }))}
          >
            {field => {
              return <SchemaFieldEditor value={field} onChange={updateField} />;
            }}
          </EditableList>
        </section>
      </MainContent>
    </>
  );
}
