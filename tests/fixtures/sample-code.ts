export interface User {
  id: string
  email: string
  name: string
}

export class UserService {
  constructor(private readonly repository: UserRepository) {}

  async findById(id: string): Promise<User | null> {
    return this.repository.findById(id)
  }

  async create(data: CreateUserDto): Promise<User> {
    return this.repository.save(data)
  }
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
