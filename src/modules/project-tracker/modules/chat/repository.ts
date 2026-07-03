import { dbState, generateUUID, saveDatabase } from "../../db.ts";
import { ChatMessage } from "../../types.ts";

export class ChatRepository {
  async getMessagesByProject(projectId: string): Promise<ChatMessage[]> {
    return dbState.chatMessages.filter(m => m.projectId === projectId);
  }

  async createMessage(data: Partial<ChatMessage>): Promise<ChatMessage> {
    const newMessage: ChatMessage = {
      id: generateUUID(),
      projectId: data.projectId!,
      authorId: data.authorId!,
      authorName: data.authorName!,
      content: data.content!,
      createdAt: new Date().toISOString()
    };

    dbState.chatMessages.push(newMessage);
    saveDatabase();
    return newMessage;
  }
}
