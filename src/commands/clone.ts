import {SystemEnvironment, Resolver} from '../types'
import {
  readProjectIdFromProjectFile,
  isValidProjectFilePath, writeProjectFile
} from '../utils/file'
import {
  noProjectIdMessage,
  cloningProjectMessage,
  noProjectFileOrIdMessage,
  invalidProjectFilePathMessage,
  multipleProjectFilesForCloneMessage,
  clonedProjectMessage,
  graphcoolCloneProjectFileName, graphcoolProjectFileName
} from '../utils/constants'
import {
  parseErrors,
  generateErrorOutput,
  pullProjectInfo, cloneProject
} from '../api/api'
const debug = require('debug')('graphcool')

interface Props {
  sourceProjectId: string
  projectFile?: string
  outputPath?: string
  name?: string
  includeMutationCallbacks?: boolean
  includeData?: boolean
}

export default async(props: Props, env: SystemEnvironment): Promise<void> => {
  const {resolver, out} = env

  try {

    console.log(`Clone with props: ${JSON.stringify(props)}`)

    const projectId = props.sourceProjectId
    out.startSpinner(cloningProjectMessage)

    const includeMutationCallbacks = props.includeMutationCallbacks !== undefined ? props.includeMutationCallbacks : true
    const includeData = props.includeData !== undefined ? props.includeData : true

    const clonedProjectName = await getClonedProjectName(props, projectId, resolver)
    const clonedProjectInfo = await cloneProject(projectId, clonedProjectName, includeMutationCallbacks, includeData, resolver)

    const projectFile = props.projectFile || graphcoolProjectFileName
    const outputPath = props.outputPath || graphcoolCloneProjectFileName(projectFile)

    console.log(`Project file: ${projectFile}, Output path: ${outputPath}`)

    writeProjectFile(clonedProjectInfo, resolver, outputPath)

    out.stopSpinner()
    const message = clonedProjectMessage(clonedProjectName, outputPath, clonedProjectInfo.projectId)
    out.write(message)

  } catch(e) {
    out.stopSpinner()
    if (e.errors) {
      const errors = parseErrors(e)
      const output = generateErrorOutput(errors)
      out.writeError(`${output}`)
    } else {
      throw e
    }

  }

}

async function getClonedProjectName(props: Props, projectId: string, resolver: Resolver): Promise<string> {
  if (props.name) {
    return Promise.resolve(props.name)
  }

  const projectInfo = await pullProjectInfo(projectId, resolver)
  const clonedPojectName = `Clone of ${projectInfo.name}`
  return clonedPojectName
}
