/**
 * Định nghĩa cấu trúc dữ liệu JSON cho các khối nội dung trang chủ (Homepage CMS).
 * Được sử dụng bởi cả Admin Editor và Server Renderer.
 */

export type BlockType = 'banner' | 'about' | 'services';

export interface BaseBlock {
  id: string;
  type: BlockType;
  isVisible: boolean;
}

export interface BannerBlock extends BaseBlock {
  type: 'banner';
  title: string;
  subtitle: string;
  imageUrl: string;
  buttonText: string;
  buttonLink: string;
}

export interface AboutBlock extends BaseBlock {
  type: 'about';
  title: string;
  content: string;
  imageUrl: string;
}

export interface ServicesBlock extends BaseBlock {
  type: 'services';
  title: string;
  itemCount: number;
}

export type HomePageBlock = BannerBlock | AboutBlock | ServicesBlock;
