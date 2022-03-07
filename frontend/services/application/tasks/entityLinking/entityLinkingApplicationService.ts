import {AnnotationApplicationService} from '../annotationApplicationService'
import {EntityLinkingDTO} from './entityLinkingData'
import {APIEntityLinkingRepository} from '~/repositories/tasks/entityLinking/apiEntityLinking'
import {EntityLinkingLabel} from '~/domain/models/tasks/entityLinking'


export class EntityLinkingApplicationService extends AnnotationApplicationService<EntityLinkingLabel> {
    constructor(
        readonly repository: APIEntityLinkingRepository,
    ) {
        super(new APIEntityLinkingRepository())
    }

    public async list(projectId: string, docId: number): Promise<EntityLinkingDTO[]> {
        const items = await this.repository.list(projectId, docId)
        return items.map(item => new EntityLinkingDTO(item))
    }

    public async create(projectId: string, docId: number, ent_id: string, startOffset: number, endOffset: number): Promise<void> {
        const item = new EntityLinkingLabel(0, ent_id, 0, startOffset, endOffset)
        await this.repository.create(projectId, docId, item)
    }

    public async changeLabel(projectId: string, docId: number, annotationId: number, ent_id: string): Promise<void> {
        await this.repository.update(projectId, docId, annotationId, ent_id)
    }
}
