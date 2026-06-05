import { Entity, Column, PrimaryGeneratedColumn} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true, nullable: false })
  email!: string;

  @Column({ nullable: false })
  passwordHash!: string;

  @Column({ unique: true, nullable: false })
  username!: string;

  @Column({ nullable: false })
  phoneNumber!: string;
}