import { adapt } from '@cycle/run/lib/adapt';
import { Stream } from 'xstream';
import fromEvent from 'xstream/extra/fromEvent';

export class SelectionSource implements ISelectionSource {
  private document: Document;

  constructor(document?: Document) {
    this.document = document === undefined ? /* istanbul ignore next */ window.document : document;
  }

  public selections(): Stream<Selection> {
    const selection$ = fromEvent(this.document, 'selectionchange')
      .map(() => this.document.getSelection() as Selection);

    return adapt(selection$);
  }
}

export function selectionDriver(): ISelectionSource {
    return new SelectionSource(document)
}

export interface ISelectionSource {
  selections(): Stream<Selection>;
}
