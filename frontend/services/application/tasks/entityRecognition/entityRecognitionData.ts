import { EntityRecognitionLabelingLabel } from '~/domain/models/tasks/entityRecognition'


export class EntityRecognitionDTO {
  id: number;
  ent_id: string;
  user: number;
  startOffset: number;
  endOffset: number;

  constructor(item: EntityRecognitionLabelingLabel) {
    this.id = item.id;
    this.ent_id = item.ent_id;
    this.user = item.user;
    this.startOffset = item.startOffset;
    this.endOffset = item.endOffset;
  }
}
