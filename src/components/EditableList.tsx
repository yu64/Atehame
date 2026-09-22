import Divider from '@src/components/Divider';
import { If } from '@src/components/util/If';
import { insertAt, insertBetween, moveAt, removeAt } from '@src/util/CollectionUtil';
import React from 'react';

export interface EditableListProps<T> {
  items: T[];
  getKey: (item: T) => React.Key;
  dataFactory: (index: number) => T;
  label: (item: T, index: number) => string;
  /** データに対応するReact要素のファクトリ */
  children: (item: T, index: number) => React.ReactNode;
  onChange: (items: T[]) => void;
}

export default function EditableList<T>(props: EditableListProps<T>) {

  // 現在のデータをReact要素に変換
  const elements = props.items.map((item, index) => (
    <div
      key={`item-${props.getKey(item)}`}
      className="flex flex-row gap-2"
    >
      <Sorter
        label={props.label(item, index)}
        index={index}
        min={0}
        max={props.items.length - 1}
        onPrev={() => {
          const nextItems = moveAt(props.items, index, index - 1);
          props.onChange(nextItems);
        }}
        onNext={() => {
          const nextItems = moveAt(props.items, index, index + 1);
          props.onChange(nextItems);
        }}
      />
      {props.children(item, index)}
      <Suffix onRemove={() => props.onChange(removeAt(props.items, index))}/>
    </div>
  ));

  const iterated = [
    <Divider 
      key={`sep-null-${0}`}
      label="追加"
      onClick={() => {
        const newItem = props.dataFactory(0);
        const nextItems = insertAt(props.items, 0, newItem);
        props.onChange(nextItems);
      }}
    />,
    ...(insertBetween(elements, (_, [prevIdx, nextIdx]) => (
      <Divider
        key={`sep-${prevIdx}-${nextIdx}`}
        label="追加"
        onClick={() => {
          const newItem = props.dataFactory(nextIdx);
          const nextItems = insertAt(props.items, nextIdx, newItem);
          props.onChange(nextItems);
        }}
      />
    ))),
    ...(
      elements.length > 0
      ? [<Divider
        key={`sep-${elements.length - 1}-null`}
        label="追加"
        onClick={() => {
          const newItem = props.dataFactory(elements.length);
          const nextItems = insertAt(props.items, elements.length, newItem);
          props.onChange(nextItems);
        }}
      />]
      : []
    )
  ];

  const listItems = iterated.map(element => (
    <li key={element.key}>
      {element}
    </li>
  ));

  return (
    <ul className="flex flex-col gap-1">
      {listItems}
    </ul>
  );
}

interface SorterProps {
  label: string;
  index: number;
  min: number;
  max: number;
  onPrev?: () => void;
  onNext?: () => void;
}

function Sorter(props: SorterProps) {
  return (
    <div className="flex flex-col">
      <If value={props.min < props.index} mode="space">
        <button className='atehame-btn-secondary' disabled={props.index <= props.min} onClick={props.onPrev}>↑</button>
      </If>
      <span className="grow flex flex-col items-center justify-center">{props.label}</span>
      <If value={props.index < props.max} mode="space">
        <button className='atehame-btn-secondary' disabled={props.index >= props.max} onClick={props.onNext}>↓</button>
      </If>
    </div>
  );
}

interface SuffixProps {
  onRemove?: () => void
}

function Suffix(props: SuffixProps)
{
  return (
    <div className="flex flex-col justify-between">
      <button className='atehame-btn-secondary' onClick={props.onRemove}>×</button>
      {/* <button className='atehame-btn-secondary'>#</button> */}
    </div>
  )
}
