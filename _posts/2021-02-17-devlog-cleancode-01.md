---
layout: post
title: "클린 코드 - Case Study: 모듈 리팩토링"
tags: [clean_code, nestjs]
---

## Clean code

**PPP - Clean Code** 라는 책을 읽고, 책에서 다루는 case study에서 기술하는 대로 직접 모듈 리팩토링을 진행한 후기를 전해드립니다.

Clean code는 너무 좋은 책이고 배울 것이 많습니다. 책을 읽으면서 진행하던 사이드 프로젝트의 코드가 떠올랐습니다. 책을 한 챕터씩 읽어나갈 때마다 프로젝트를 다 날리고 처음부터 작성하고 싶은 마음이 커져만 갔습니다. 하지만 이 책의 저자인 로버트 C. 마틴이 설명하는 것처럼, 깔끔한 코드는 규모가 어느 정도 있는 프로젝트에서는 한 번에 만들어지는 것도 아니며, 한 번 청소했다고 절대 깨끗하게 유지되지 않습니다. 새로운 코드를 작성하고, 기존 코드를 수정할 때마다 항상 작성한 코드를 리팩토링하고, 읽기 쉬운 코드로 만들어야 합니다. (_보이스카우트 원칙_) 이러한 마음가짐으로 만들던 사이드 프로젝트에서 모듈 하나를 가져와, clean code에서 지적하는 점들을 고치며 리팩토링을 해보았습니다.

<!--more-->

> **보이스카우트 원칙** - _Clean code (로버트 C. 마틴, 박재호/이재영 역), p18~19_
>
> 미국 보이스카우트가 따르는 간단한 규칙이 우리 전문가들에게도 유용하다.
>
> - 캠프장은 처음 왔을 때보다 더 깨끗하게 해놓고 떠나라.
>
> 체크아웃할 때보다 좀 더 깨끗한 코드를 체크인한다면 코드는 절대 나빠지지 않는다. 한꺼번에 많은 시간과 노력을 투자해 코드를 정리할 필요가 없다. 변수 이름 하나를 개선하고, 조금 긴 함수 하나를 분할하고, 약간의 중복을 제거하고, 복잡한 if문 하나를 정리하면 충분하다.

[책 링크 (yes24)](http://www.yes24.com/Product/Goods/11681152)

### 리팩토링 전 코드

먼저 리팩토링 전 코드를 소개합니다. (`admin-users.service.ts`)

```typescript
import { compare, hash } from "bcrypt";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { CreateAdminUserDto } from "./dtos/create-admin-user.dto";
import { UpdateAdminUserProfileDto } from "./dtos/update-admin-user-profile.dto";
import { AdminUser, AdminUserRole } from "./models/admin-user.model";
import { UniqueConstraintError } from "sequelize";
import {
  ROOT_DEFAULT_PASSWORD,
  ROOT_DISPLAY_NAME,
  ROOT_USERNAME,
} from "./const";

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectModel(AdminUser) private readonly adminUserModel: typeof AdminUser
  ) {
    this.ensureRootUserExists();
  }

  private readonly bcyrptSaltRounds = 10;

  async getAll(): Promise<AdminUser[]> {
    return this.adminUserModel.findAll({ order: [["createdAt", "ASC"]] });
  }

  async getOne(userId: string): Promise<AdminUser> {
    return this.adminUserModel.findByPk(userId);
  }

  async findOneByUsername(username: string): Promise<AdminUser> {
    const adminUser = await this.adminUserModel.findOne({
      where: { username },
    });
    if (!adminUser) {
      throw new NotFoundException(`user with username ${username} not found`);
    }

    return adminUser;
  }

  async createOne(
    adminUserData: CreateAdminUserDto
  ): Promise<{ user: AdminUser; password: string }> {
    try {
      const password = this.generatePassword();
      const adminUser = await this.adminUserModel.create({
        ...adminUserData,
        passwordHash: await this.hashPassword(password),
      });

      return { user: adminUser, password };
    } catch (e) {
      if (e instanceof UniqueConstraintError) {
        throw new BadRequestException(
          `user with username ${adminUserData.username} already exists`
        );
      }
      throw e;
    }
  }

  async updateProfile(
    userId: string,
    adminUserProfileData: UpdateAdminUserProfileDto
  ): Promise<AdminUser> {
    const adminUser = await this.adminUserModel.findByPk(userId);
    if (!adminUser) {
      throw new NotFoundException(`user with id ${userId} not found`);
    }

    await adminUser.update(adminUserProfileData);
    return adminUser;
  }

  async resetPassword(userId: string): Promise<{ password: string }> {
    const adminUser = await this.adminUserModel.findByPk(userId);
    if (!adminUser) {
      throw new NotFoundException(`user with id ${userId} not found`);
    }

    const password = this.generatePassword();
    await adminUser.update({
      passwordHash: await this.hashPassword(password),
      isDefaultPassword: true,
    });

    return { password };
  }

  async isUsingDefaultPassword(userId: string): Promise<boolean> {
    const adminUser = await this.adminUserModel.findByPk(userId);
    if (!adminUser) {
      throw new NotFoundException(`user with id ${userId} not found`);
    }

    return adminUser.isDefaultPassword;
  }

  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const adminUser = await this.adminUserModel.findByPk(userId);
    if (!adminUser) {
      throw new NotFoundException(`user with id ${userId} not found`);
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException(
        `new password should be different from current password`
      );
    }

    const isPasswordCorrect = await this.checkPassword(
      adminUser.passwordHash,
      currentPassword
    );

    if (isPasswordCorrect) {
      adminUser.passwordHash = await this.hashPassword(newPassword);
      adminUser.isDefaultPassword = false;
      await adminUser.save();
    } else {
      throw new ForbiddenException(`password does not match`);
    }
  }

  async updateRole(userId: string, role: AdminUserRole): Promise<AdminUser> {
    const adminUser = await this.adminUserModel.findByPk(userId);
    if (!adminUser) {
      throw new NotFoundException(`user with id ${userId} not found`);
    }

    await adminUser.update({ role });
    return adminUser;
  }

  async deleteOne(userId: string): Promise<string> {
    const adminUser = await this.adminUserModel.findByPk(userId);
    if (!adminUser) {
      throw new NotFoundException(`user with id ${userId} not found`);
    }

    await adminUser.destroy();
    return userId;
  }

  private generatePassword(length = 6): string {
    return `${Math.floor(Math.random() * Math.pow(10, length))}`;
  }

  private hashPassword(plain: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      hash(plain, this.bcyrptSaltRounds, (err, hash) => {
        if (err) {
          reject(err);
        } else {
          resolve(hash);
        }
      });
    });
  }

  checkPassword(passwordHash: string, candidate: string) {
    return new Promise<boolean>((resolve) => {
      compare(candidate, passwordHash, (err, result) => {
        if (err || !result) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  private async ensureRootUserExists(): Promise<void> {
    const rootUser = await this.adminUserModel.findOne({
      where: { username: ROOT_USERNAME },
    });

    if (!rootUser) {
      await this.adminUserModel.create({
        username: ROOT_USERNAME,
        passwordHash: await this.hashPassword(ROOT_DEFAULT_PASSWORD),
        displayName: ROOT_DISPLAY_NAME,
        role: AdminUserRole.owner,
      });
    }
  }
}
```

`AdminUsersService` 는 관리자에 관한 인터페이스를 노출하고 있습니다. `getAll`, `getOne(userId: string)` 등 관리자를 가져오는 메소드, `createOne(adminUserData: CreateAdminUserDto)` 처럼 관리자를 생성하는 메소드 등이 존재합니다. 이에 대한 구현은 관리자를 다루는 repository인 `adminUserModel` 을 통해 이루어집니다. (`adminUserModel` 은 `@nestjs/sequelize` 에서 제공하는 dependency injection을 통해 service에서 사용할 수 있습니다. 이 아래 레벨에는 sequelize model이 존재하겠죠.)

이 파일을 점차적으로 작성되었습니다. 처음에는 특정 `username`을 가진 관리자 하나를 찾는 메소드 `findOneByUsername` 로부터 시작했습니다. Controller에서 요구하는 기능이 늘어남에 따라, `AdminUserService` 의 인터페이스를 확장했고, 이에 대한 구현을 작성했습니다. 코드를 리팩토링한 적은 없지만, 200줄 정도 되는 괜찮은 길이의 클래스로 보입니다. 메소드에 담긴 로직도 너무 복잡하지 않습니다. 그래도 개선을 할 수 있는 만큼 해보기로 했습니다 :)

### 이름 짓기

`AdminUsersService`의 인터페이스(public method)를 요약하면 다음과 같습니다.

```typescript
export class AdminUsersService {
  getAll(): Promise<AdminUser[]>;
  getOne(userId: string): Promise<AdminUser>;
  findOneByUsername(username: string): Promise<AdminUser>;
  createOne(
    adminUserData: CreateAdminUserDto
  ): Promise<{ user: AdminUser; password: string }>;
  updateProfile(
    userId: string,
    adminUserProfileData: UpdateAdminUserProfileDto
  ): Promise<AdminUser>;
  resetPassword(userId: string): Promise<{ password: string }>;
  isUsingDefaultPassword(userId: string): Promise<boolean>;
  updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void>;
  updateRole(userId: string, role: AdminUserRole): Promise<AdminUser>;
  deleteOne(userId: string): Promise<string>;
}
```

여기에서 다음과 같이 리팩토링을 진행했습니다.

- **`resetPassword`**를 더 명확하고 다른 `update...` 형태의 메소드와 일관성 있게, **`updateToDefaultPassword`**로 변경합니다.

### 필요없는 인터페이스 제거하기

- `isUsingDefaultPassword`를 굳이 `AdminUsersService`의 메소드로 노출해야 할까요? 이 메소드의 구현을 보면 다음과 같습니다.

```typescript
async isUsingDefaultPassword(userId: string): Promise<boolean> {
  const adminUser = await this.adminUserModel.findByPk(userId);
  if (!adminUser) {
    throw new NotFoundException(`user with id ${userId} not found`);
  }

  return adminUser.isDefaultPassword;
}
```

이 메소드는 `adminUser`를 가져온 후 `isDefaultPassword` 필드를 꺼내 주는 동작만 수행합니다. 충분히 `getOne`으로 가져온 `adminUser`에 `adminUser.isDefaultPassword`로 접근하는 것으로 대체할 수 있습니다. 실제로 이 메소드를 검색해 보니 사용되는 곳이 없었습니다. 이러한 기능이 필요한 곳에서는 `isUsingDefaultPassword` 메소드를 사용하는 대신, `getOne(userId).isDefaultPassword`로 기본 비밀번호를 사용하는지 알아내고 있었습니다. **따라서 메소드를 삭제합니다.** 만약 기본 비밀번호를 판정하는 로직이 복잡하고, 여러 곳에서 재사용될 가능성이 있다면 이는 함수로 만들어야 합니다. **단, `AdminUsersService`의 메소드가 아니라 `AdminUser`의 메소드가 바로 올바른 위치가 될 것입니다.**

이름을 정리한 `AdminUsersService`의 public method 목록입니다.

```typescript
export class AdminUsersService {
  // RETRIEVE
  getAll(): Promise<AdminUser[]>;
  getOne(userId: string): Promise<AdminUser>;
  findOneByUsername(username: string): Promise<AdminUser>;

  // CREATE
  createOne(
    adminUserData: CreateAdminUserDto
  ): Promise<{ user: AdminUser; password: string }>;

  // UPDATE
  updateProfile(
    userId: string,
    adminUserProfileData: UpdateAdminUserProfileDto
  ): Promise<AdminUser>;
  updateToDefaultPassword(userId: string): Promise<{ password: string }>;
  updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void>;
  updateRole(userId: string, role: AdminUserRole): Promise<AdminUser>;

  // DELETE
  deleteOne(userId: string): Promise<string>;
}
```

메소드가 수행하는 동작 (create, retrieve, update, delete)에 따라 메소드 이름이 잘 지어졌다고 생각합니다. 인자의 개수도 대부분 하나 또는 둘이고, 해당 자리에 들어가는 인자가 무엇이 될지 잘 추측할 수 있습니다. 따라서 public method의 이름은 이 정도로 정리합니다.

### 관련없는 메소드 분리하기

이제 private method들을 살펴봅시다. 먼저 기존 코드에 `checkPassword`라는 메소드가 있는데, 이 메소드에는 `private` 키워드가 붙어있지 않았습니다. 오타로 추정되어서 `private` 키워드를 추가했습니다.

```javascript
  private generatePassword(length = 6): string {
    return `${Math.floor(Math.random() * Math.pow(10, length))}`;
  }

  private hashPassword(plain: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      hash(plain, this.bcyrptSaltRounds, (err, hash) => {
        if (err) {
          reject(err);
        } else {
          resolve(hash);
        }
      });
    });
  }

  private checkPassword(passwordHash: string, candidate: string) {
    return new Promise<boolean>((resolve) => {
      compare(candidate, passwordHash, (err, result) => {
        if (err || !result) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  private async ensureRootUserExists(): Promise<void> {
    const rootUser = await this.adminUserModel.findOne({
      where: { username: ROOT_USERNAME },
    });

    if (!rootUser) {
      await this.adminUserModel.create({
        username: ROOT_USERNAME,
        passwordHash: await this.hashPassword(ROOT_DEFAULT_PASSWORD),
        displayName: ROOT_DISPLAY_NAME,
        role: AdminUserRole.owner,
      });
    }
  }
```

- 이 중 `generatePassword`, `hashPassword`, `checkPassword` 메소드를 주의깊게 살펴봅시다. 이 메소드들은 **AdminUser와 관련된 동작을 하지 않습니다!** 이를 가장 쉽게 알아볼 수 있는 것은, 메소드 내에서 `this`를 전혀 사용하지 않는다는 점입니다. (유일하게 사용하는 `this.bcryptSaltRounds`도 상수인 10을 불러올 뿐입니다.) 이 메소드들은 이름도 비슷합니다. 비밀번호와 관련된 동작을 하는 메소드들을 분리하여 새로운 클래스를 만들어야 한다는 뜻입니다.

- 또한, `ensureRootUserExists`는 이 클래스의 생성자에서 사용합니다. 하지만 생성자는 맨 위에 있는데, 이 함수는 맨 아래에 있어서 생성자를 읽다가 이 함수가 무엇을 의미하는지 보려면 한참을 아래로 내려가야 합니다. **`ensureRootUserExists`를 `constructor` 바로 아래에 나오도록 위치를 변경해 주었습니다.**

비밀번호과 관련된 메소드들을 분리하여 새로운 클래스를 생성했습니다. 이 클래스는 원하는 길이의 랜덤 비밀번호를 생성할 수 있는 기능 (`generatePassword`), 비밀번호를 `bcrypt`에서 제공하는 알고리즘으로 해싱하여 결과를 반환하는 기능 (`hashPassword`), 해쉬 결과와 plain text로 된 비밀번호를 서로 비교하여 일치하는지 확인하는 기능 (`checkPassword`) 이 필요합니다. 이를 위해 다음과 같은 인터페이스를 정의했습니다.

```typescript
interface Password {
  static generate(length?: number): Password;
  hash(): Promise<string>;
  validateWith(hash: string): Promise<boolean>;
  getPlain(): string;
}
```

`Password.generate`, `hash`, `validateWith` 메소드는 각각 원래 `AdminUsersService` 클래스의 `generatePassword`, `hashPassword`, `checkPassword` 메소드에 대응됩니다. `getPlain` 메소드는 plain text 비밀번호를 반환할 함수입니다. 새로 만들어진 인터페이스의 구현을 `PasswordImpl` 클래스에 작성합니다.

```typescript
import { hash as bcryptHash, compare as bcryptCompare } from "bcrypt";

class PasswordImpl implements Password {
  private plain: string;
  private readonly defaultGeneratedPasswordLength = 6;
  private readonly bcryptSaltRounds = 10;

  constructor(plain: string) {
    this.plain = plain;
  }

  static generate(length = defaultGeneratedPasswordLength): Password {
    return new Password(`${Math.floor(Math.random() * Math.pow(10, length))}`);
  }

  hash(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      bcryptHash(this.plain, this.bcryptSaltRounds, (err, hash) => {
        if (err) {
          reject(err);
        } else {
          resolve(hash);
        }
      });
    });
  }

  validateWith(hash: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      bcryptCompare(this.plain, hash, (err, result) => {
        if (err || !result) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  toPlain(): string {
    return this.plain;
  }
}
```

이제 `AdminUsersService`에서 `Password` 인터페이스를 사용합니다. 먼저 `ensureRootUserExists` 메소드입니다. 이 메소드는 루트 사용자가 이미 존재하는지 체크하고, 존재하지 않는다면 미리 정의된 비밀번호 (`ROOT_DEFAULT_PASSWORD`) 로 사용자를 생성합니다.

```typescript
private async ensureRootUserExists(): Promise<void> {
  const rootUser = await this.adminUserModel.findOne({
    where: { username: ROOT_USERNAME },
  });

  if (!rootUser) {
    const rootPassword = new PasswordImpl(ROOT_DEFAULT_PASSWORD);
    const rootPasswordHash = await rootPassword.hash();

    await this.adminUserModel.create({
      username: ROOT_USERNAME,
      passwordHash: rootPasswordHash,
      displayName: ROOT_DISPLAY_NAME,
      role: AdminUserRole.owner,
    });
  }
}
```

이전의 코드에서는 DB에 추가할 사용자의 `passwordHash` 필드를 `await this.hashPassword(ROOT_DEFAULT_PASSWORD)` 처럼 `AdminUsersService` 내부에서 직접 계산했습니다. 하지만, 이제 해쉬를 계산할 책임을 `Password` 인터페이스와 그 구현체인 `PasswordImpl`로 넘겼습니다.

마찬가지로, `createOne` 메소드를 고쳐봅시다.

```typescript
async createOne(
  adminUserData: CreateAdminUserDto
): Promise<{ user: AdminUser; password: string }> {
  try {
    const password = PasswordImpl.generate();
    const passwordHash = await password.hash();

    const adminUser = await this.adminUserModel.create({
      ...adminUserData,
      passwordHash: passwordHash,
    });

    return { user: adminUser, password: password.toPlain() };
  } catch (e) {
    if (e instanceof UniqueConstraintError) {
      this.throwDuplicateUsernameException(adminUserData.username);
    }
    throw e;
  }
}
```

여기에서는 `PasswordImpl.generate` static 메소드를 사용했습니다. Factory 생성자의 역할을 하여, 랜덤 비밀번호를 만들어낸 후 해쉬를 DB에 저장하고, 생성한 plain text 비밀번호를 반환합니다. `Password` 인터페이스와 `PasswordImpl` 클래스를 사용하여 `resetPassword`, `updatePassword` 메소드도 변경해 주었습니다.

### 팩토리 패턴 적용하기

생각해보니 마음에 들지 않았던 점이 있습니다. `AdminUsersService`에서는 `Password` 인터페이스와, 이 인터페이스의 구현체인 `PasswordImpl`을 모두 알고 있습니다. 이는 비밀번호 객체를 만들 일이 있을 때 `new PasswordImpl()`, 또는 팩토리 생성자 `PasswordImpl.generate`를 사용했기 때문입니다. 그러나, 실제로는 `AdminUsersService`에서 **`Password` 인터페이스만 알고 있는 것**이 알맞습니다. 만약`Password`을 새로 구현한 `NewPasswordImpl`이 생긴다면, `AdminUsersService` 뿐만 아니라 이를 사용하는 모든 다른 모듈들도 함께 수정해야 할 것입니다.

`Password`를 사용하는 측에서 `Password`의 구현체를 몰라도 되도록 하기 위해, 팩토리 패턴을 적용해 보았습니다. `Password`를 생성하는 `PasswordFactory` 클래스를 만들고, 여기에 새로운 `Password` 객체를 만드는 책임을 할당합니다. 이렇게 되면 `AdminUsersService`에서 `PasswordImpl`을 몰라도 새 `Password`를 만들 수 있습니다. 또한, `Password`의 새 구현체를 만들어도 모든 모듈을 수정해야 할 필요가 없이 `PasswordFactory`만 수정하면 됩니다.

```typescript
export class PasswordFactory {
  private readonly defaultPasswordLength = 6;

  static create(password: string): Password {
    return new PasswordImpl(password);
  }

  static generate(length = this.defaultPasswordLength): Password {
    return this.create(`${Math.floor(Math.random() * Math.pow(10, length))}`);
  }
}
```

```typescript
private async ensureRootUserExists(): Promise<void> {
  const rootUser = await this.adminUserModel.findOne({
    where: { username: ROOT_USERNAME },
  });

  if (!rootUser) {
    // const rootPassword = new PasswordImpl(ROOT_DEFAULT_PASSWORD);
    const rootPassword = PasswordFactory.create(ROOT_DEFAULT_PASSWORD);
    const rootPasswordHash = await rootPassword.hash();

    await this.adminUserModel.create({
      username: ROOT_USERNAME,
      passwordHash: rootPasswordHash,
      displayName: ROOT_DISPLAY_NAME,
      role: AdminUserRole.owner,
    });
  }
}
```

위의 예시처럼 모든 메소드에서 `PasswordImpl`을 사용하는 부분을 `PasswordFactory`의 static 메소드를 부르도록 변경해 주었습니다.

### 함수 별 추상화 레벨 맞추기

Clean code에서는 파일이 위에서부터 아래로, 자연스럽게 읽혀야 한다고 말합니다. 한 메소드에서 부르는 다른 메소드의 내용을 확인하기 위해 파일을 위아래로 오가며 바쁘게 찾을 필요가 없도록 코드를 작성해야 합니다. 또, **한 메소드에서 다루는 추상화 수준을 비슷하게 유지해야 합니다.** 예를 들어, `updatePassword` 메소드를 보겠습니다.

```typescript
async updatePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const adminUser = await this.adminUserModel.findByPk(userId);
  if (!adminUser) {
    throw new NotFoundException(`user with id ${userId} not found`);
  }

  if (currentPassword === newPassword) {
    throw new BadRequestException(
      `new password should be different from current password`
    );
  }

  const isPasswordCorrect = await PasswordFactory.create(currentPassword)
    .validateWith(adminUser.passwordHash);

  if (isPasswordCorrect) {
    adminUser.passwordHash = await PasswordFactory.create(newPassword).hash();
    adminUser.isDefaultPassword = false;
    await adminUser.save();
  } else {
    throw new ForbiddenException(`password does not match`);
  }
}
```

이 함수에서 에러를 처리하는 로직을 살펴보면, `Exception`의 타입과 에러 메시지를 `updatePassword` 메소드에서 지정하여 던지고 있습니다. 이러한 세부사항까지 `updatePassword` 메소드에서 볼 수 있도록 하는 것은 불필요합니다. 다음과 같이 특정 상황에 에러를 던지는 메소드를 따로 정의하는 것이 더 바람직합니다.

```typescript
...

async updatePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const adminUser = await this.adminUserModel.findByPk(userId);
  if (!adminUser) {
    this.throwUserWithIdNotFoundException(userId);
  }

  if (currentPlainPassword === newPlainPassword) {
    this.throwSameNewPasswordException();
  }

  const isPasswordCorrect = await PasswordFactory.create(currentPassword)
    .validateWith(adminUser.passwordHash);

  if (isPasswordCorrect) {
    adminUser.passwordHash = await PasswordFactory.create(newPassword).hash();
    adminUser.isDefaultPassword = false;
    await adminUser.save();
  } else {
    this.throwWrongPasswordException();
  }
}

...

private throwUserWithIdNotFoundException(givenUserId: string): never {
  throw new NotFoundException(`user with id ${givenUserId} not found`);
}

private throwSameNewPasswordException(): never {
  throw new BadRequestException(
    `new password should be different from current password`
  );
}

private throwWrongPasswordException(): never {
  throw new ForbiddenException(`password does not match`);
}
```

마찬가지로 특정 메시지로 Exception을 던지는 메소드를 따로 정의하여 높은 수준의 메소드에서 로직을 더 명확하게 따라갈 수 있도록 변경했습니다.

### 중복 제거하기

이렇게 하고 보니 특정 코드가 반복되고 있음이 더 명확해졌습니다.

```typescript
const adminUser = await this.adminUserModel.findByPk(userId);
if (!adminUser) {
  this.throwUserWithIdNotFoundException(userId);
}
```

이 코드는 여러 메소드에서 중복하여 사용하고 있으므로, private 메소드로 분리해 주었습니다.

```typescript
private async findUserById(userId: string): Promise<AdminUser> {
  const adminUser = await this.adminUserModel.findByPk(userId);
  if (!adminUser) {
    this.throwUserWithIdNotFoundException(userId);
  }

  return adminUser;
}
```

### 최종 코드

이렇게 코드를 정리한 후, 한두 군데를 조금 더 깔끔하게 다듬었습니다. 아래는 리팩토링 후 `AdminUsersService` 클래스입니다.

```typescript
@Injectable()
export class AdminUsersService {
  constructor(
    @InjectModel(AdminUser) private readonly adminUserModel: typeof AdminUser
  ) {
    this.ensureRootUserExists();
  }

  private async ensureRootUserExists(): Promise<void> {
    const rootUser = await this.adminUserModel.findOne({
      where: { username: ROOT_USERNAME },
    });

    if (!rootUser) {
      const rootPassword = PasswordFactory.create(ROOT_DEFAULT_PASSWORD);
      const rootPasswordHash = await rootPassword.hash();

      await this.adminUserModel.create({
        username: ROOT_USERNAME,
        passwordHash: rootPasswordHash,
        displayName: ROOT_DISPLAY_NAME,
        role: AdminUserRole.owner,
      });
    }
  }

  async getAll(): Promise<AdminUser[]> {
    return this.adminUserModel.findAll({ order: [["createdAt", "ASC"]] });
  }

  async getOne(userId: string): Promise<AdminUser> {
    return this.adminUserModel.findByPk(userId);
  }

  async findOneByUsername(username: string): Promise<AdminUser> {
    const adminUser = await this.adminUserModel.findOne({
      where: { username },
    });
    if (!adminUser) {
      this.throwUserWithNameFoundException(username);
    }

    return adminUser;
  }

  async createOne(
    adminUserData: CreateAdminUserDto
  ): Promise<{ user: AdminUser; password: string }> {
    try {
      const password = PasswordFactory.generate();
      const passwordHash = await password.hash();

      const adminUser = await this.adminUserModel.create({
        ...adminUserData,
        passwordHash: passwordHash,
      });

      return { user: adminUser, password: password.toString() };
    } catch (e) {
      if (e instanceof UniqueConstraintError) {
        this.throwDuplicateUsernameException(adminUserData.username);
      }
      throw e;
    }
  }

  async updateProfile(
    userId: string,
    adminUserProfileData: UpdateAdminUserProfileDto
  ): Promise<AdminUser> {
    const adminUser = await this.findUserById(userId);

    await adminUser.update(adminUserProfileData);

    return adminUser;
  }

  async updateToDefaultPassword(userId: string): Promise<{ password: string }> {
    const adminUser = await this.findUserById(userId);

    const password = PasswordFactory.generate();
    const passwordHash = await password.hash();

    await adminUser.update({
      passwordHash,
      isDefaultPassword: true,
    });

    return { password: password.toString() };
  }

  async updatePassword(
    userId: string,
    currentPlainPassword: string,
    newPlainPassword: string
  ): Promise<void> {
    const adminUser = await this.findUserById(userId);

    if (currentPlainPassword === newPlainPassword) {
      this.throwSameNewPasswordException();
    }

    const isPasswordCorrect = await PasswordFactory.create(
      currentPlainPassword
    ).validateWith(adminUser.passwordHash);

    const newPassword = PasswordFactory.create(newPlainPassword);
    const newPasswordHash = await newPassword.hash();

    if (isPasswordCorrect) {
      await adminUser.update({
        passwordHash: newPasswordHash,
        isDefaultPassword: false,
      });
    } else {
      this.throwWrongPasswordException();
    }
  }

  async updateRole(userId: string, role: AdminUserRole): Promise<AdminUser> {
    const adminUser = await this.findUserById(userId);

    await adminUser.update({ role });

    return adminUser;
  }

  async deleteOne(userId: string): Promise<string> {
    const adminUser = await this.findUserById(userId);

    await adminUser.destroy();

    return userId;
  }

  private async findUserById(userId: string): Promise<AdminUser> {
    const adminUser = await this.adminUserModel.findByPk(userId);
    if (!adminUser) {
      this.throwUserWithIdNotFoundException(userId);
    }

    return adminUser;
  }

  private throwUserWithIdNotFoundException(givenUserId: string): never {
    throw new NotFoundException(`user with id ${givenUserId} not found`);
  }

  private throwUserWithNameFoundException(givenUsername: string): never {
    throw new NotFoundException(
      `user with username ${givenUsername} not found`
    );
  }

  private throwDuplicateUsernameException(givenUsername: string): never {
    throw new BadRequestException(
      `user with username ${givenUsername} already exists`
    );
  }

  private throwSameNewPasswordException(): never {
    throw new BadRequestException(
      `new password should be different from current password`
    );
  }

  private throwWrongPasswordException(): never {
    throw new ForbiddenException(`password does not match`);
  }
}
```

처음 코드와 비교했을 때 얼마나 깔끔해졌는지 평가해주시는 것은 이 글을 읽어주시는 여러분의 몫입니다 :)
