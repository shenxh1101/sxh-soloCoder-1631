import { Clothing, CLOTHING_TYPE_LABELS } from '../../shared/types';
import Barcode from './Barcode';

interface ReceiptProps {
  clothing: Clothing;
  storeName?: string;
  storePhone?: string;
}

export default function Receipt({ clothing, storeName = '洁衣管家干洗店', storePhone = '400-888-8888' }: ReceiptProps) {
  return (
    <div className="print-receipt bg-white" id="print-receipt">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold mb-1">{storeName}</h2>
        <p className="text-xs text-gray-500">取 衣 单</p>
        <div className="border-b border-dashed border-gray-300 my-3" />
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">单号：</span>
          <span className="font-mono font-medium">{clothing.barcode}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">衣物类型：</span>
          <span>{CLOTHING_TYPE_LABELS[clothing.clothingType]}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">客户电话：</span>
          <span>{clothing.customerPhone}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">收衣日期：</span>
          <span>{clothing.receiveDate}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">取衣日期：</span>
          <span>{clothing.expectedPickupDate}</span>
        </div>
        <div className="flex justify-between font-bold text-lg border-t border-dashed border-gray-300 pt-2 mt-2">
          <span>金额：</span>
          <span className="text-danger">¥{clothing.price.toFixed(2)}</span>
        </div>
      </div>

      {clothing.remark && (
        <div className="mt-3 p-2 bg-yellow-50 rounded text-xs">
          <span className="text-yellow-700 font-medium">备注：</span>
          <span className="text-yellow-800">{clothing.remark}</span>
        </div>
      )}

      <div className="mt-4 flex justify-center">
        <Barcode value={clothing.barcode} height={50} fontSize={10} />
      </div>

      <div className="border-t border-dashed border-gray-300 mt-4 pt-3 text-center text-xs text-gray-500">
        <p>电话：{storePhone}</p>
        <p className="mt-1">请妥善保管此单，取衣时出示</p>
        <p className="mt-1">感谢您的惠顾！</p>
      </div>
    </div>
  );
}
