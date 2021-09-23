import {AnnotationApplicationService} from '../annotationApplicationService'
import {EntityRecognitionDTO} from './entityRecognitionData'
import {APIEntityRecognitionRepository} from '~/repositories/tasks/entityRecognition/apiEntityRecognition'
import {EntityRecognitionLabelingLabel} from '~/domain/models/tasks/entityRecognition'


export class EntityRecognitionApplicationService extends AnnotationApplicationService<EntityRecognitionLabelingLabel> {
    constructor(
        readonly repository: APIEntityRecognitionRepository,
    ) {
        super(new APIEntityRecognitionRepository())
    }

    public async list(projectId: string, docId: number): Promise<EntityRecognitionDTO[]> {
        const items = await this.repository.list(projectId, docId)
        return items.map(item => new EntityRecognitionDTO(item))
    }

    public async create(projectId: string, docId: number, ent_id: string, startOffset: number, endOffset: number): Promise<void> {
        const item = new EntityRecognitionLabelingLabel(0, ent_id, 0, startOffset, endOffset)
        await this.repository.create(projectId, docId, item)
    }

    public async changeLabel(projectId: string, docId: number, annotationId: number, ent_id: string): Promise<void> {
        await this.repository.update(projectId, docId, annotationId, ent_id)
    }
}
