import { AnnotationModel } from './interface'

export class EntityRecognitionLabelingLabel implements AnnotationModel {
  constructor(
    public id: number,
    public ent_id: string,
    public user: number,
    public startOffset: number,
    public endOffset: number
  ) {}

  static valueOf(
    { id, ent_id, user, start_offset, end_offset }:
    { id: number, ent_id: string, user: number, start_offset: number, end_offset: number }
  ) {
    return new EntityRecognitionLabelingLabel(id, ent_id, user, start_offset, end_offset)
  }

  toObject() {
    return {
      id: this.id,
      ent_id: this.ent_id,
      user: this.user,
      start_offset: this.startOffset,
      end_offset: this.endOffset
    }
  }
}