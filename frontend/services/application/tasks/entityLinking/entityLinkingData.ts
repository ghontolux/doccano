import { EntityLinkingLabel } from '~/domain/models/tasks/entityLinking'


export class EntityLinkingDTO {
  id: number;
  ent_id: string;
  user: number;
  startOffset: number;
  endOffset: number;

  constructor(item: EntityLinkingLabel) {
    this.id = item.id;
    this.ent_id = item.ent_id;
    this.user = item.user;
    this.startOffset = item.startOffset;
    this.endOffset = item.endOffset;
  }
}
